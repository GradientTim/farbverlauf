import type { ChatInputCommandInteraction, Guild, OverwriteResolvable, Role } from 'discord.js'
import {
  type CategoryChannel,
  ChannelType,
  DiscordAPIError,
  MessageFlagsBitField,
  OverwriteType,
  PermissionFlagsBits,
} from 'discord.js'

import { consola } from 'consola'

import { ROLE_MAINTAINER_PREFIX, ROLE_PROJECT_PREFIX } from '~/constants/role.constants.ts'

function describeError(error: unknown): string {
  if (error instanceof DiscordAPIError) {
    return `${error.message} (code ${error.code}, ${error.method} ${error.url}, raw: ${JSON.stringify(error.rawError)})`
  }
  return String(error)
}

function roleName(prefix: string, name: string) {
  return `${prefix} ${name}`
}

// Every channel that denies @everyone ViewChannel must also explicitly allow it back to the
// bot itself. Without this, the bot loses ViewChannel on the channel it just created (its
// Manage Roles/Manage Channels permissions don't matter without it), and locks itself out of
// managing (or even seeing) that channel afterwards.
function botOverwrite(guild: Guild): OverwriteResolvable {
  return {
    id: guild.client.user.id,
    type: OverwriteType.Member,
    allow: [PermissionFlagsBits.ViewChannel],
  }
}

function findProjectCategory(guild: Guild, name: string) {
  return guild.channels.cache.find(
    (channel): channel is CategoryChannel =>
      channel.type === ChannelType.GuildCategory && channel.name === name,
  )
}

function findProject(guild: Guild, name: string) {
  const projectRole = guild.roles.cache.find(
    (role) => role.name === roleName(ROLE_PROJECT_PREFIX, name),
  )
  const maintainerRole = guild.roles.cache.find(
    (role) => role.name === roleName(ROLE_MAINTAINER_PREFIX, name),
  )

  return { category: findProjectCategory(guild, name), projectRole, maintainerRole }
}

async function replyEphemeral(interaction: ChatInputCommandInteraction, content: string) {
  await interaction.reply({ content, flags: MessageFlagsBitField.Flags.Ephemeral })
}

async function requireGuild(interaction: ChatInputCommandInteraction) {
  const { guild } = interaction
  if (!guild) {
    await replyEphemeral(interaction, 'This command can only be used in a server.')
    return null
  }
  return guild
}

async function requireProject(
  interaction: ChatInputCommandInteraction,
  guild: Guild,
  name: string,
) {
  const { category, projectRole, maintainerRole } = findProject(guild, name)
  if (!category || !projectRole) {
    await replyEphemeral(interaction, `No project named **${name}** was found.`)
    return null
  }
  return { category, projectRole, maintainerRole }
}

async function runDeferred(
  interaction: ChatInputCommandInteraction,
  errorMessage: string,
  action: () => Promise<string>,
) {
  await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral })

  try {
    await interaction.editReply(await action())
  } catch (error: unknown) {
    consola.error(error)
    await interaction.editReply(`${errorMessage}: ${describeError(error)}`)
  }
}

export async function createProject(interaction: ChatInputCommandInteraction, name: string) {
  const guild = await requireGuild(interaction)
  if (!guild) return

  if (findProjectCategory(guild, name)) {
    await replyEphemeral(interaction, `A project named **${name}** already exists.`)
    return
  }

  await runDeferred(
    interaction,
    'There was an error while creating the project. Any partial changes were rolled back.',
    async () => {
      const createdRoles: Role[] = []

      try {
        const projectRole = await guild.roles.create({ name: roleName(ROLE_PROJECT_PREFIX, name) })
        createdRoles.push(projectRole)

        const maintainerRole = await guild.roles.create({
          name: roleName(ROLE_MAINTAINER_PREFIX, name),
        })
        createdRoles.push(maintainerRole)

        const category = await guild.channels.create({
          name,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: projectRole.id, allow: [PermissionFlagsBits.ViewChannel] },
            botOverwrite(guild),
          ],
        })

        // Discord assigns `position` per channel type (text/announcement/forum each have their
        // own counter), then sorts the whole category by that raw number regardless of type.
        // Without explicit positions here, channels of different types end up interleaved in a
        // near-arbitrary order instead of the order below.
        await guild.channels.create({
          name: 'announcements',
          type: ChannelType.GuildAnnouncement,
          parent: category.id,
          position: 0,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
            { id: projectRole.id, deny: [PermissionFlagsBits.SendMessages] },
            {
              id: maintainerRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
          ],
        })

        await guild.channels.create({
          name: 'feedback',
          type: ChannelType.GuildForum,
          parent: category.id,
          position: 1,
        })

        await guild.channels.create({
          name: 'general-chat',
          type: ChannelType.GuildText,
          parent: category.id,
          position: 2,
        })

        await guild.channels.create({
          name: 'maintainer-chat',
          type: ChannelType.GuildText,
          parent: category.id,
          position: 3,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: projectRole.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: maintainerRole.id, allow: [PermissionFlagsBits.ViewChannel] },
            botOverwrite(guild),
          ],
        })

        for (const [index, forumName] of ['admin-help', 'developer-help'].entries()) {
          await guild.channels.create({
            name: forumName,
            type: ChannelType.GuildForum,
            parent: category.id,
            position: 4 + index,
          })
        }

        return `Project **${name}** has been created!`
      } catch (error: unknown) {
        for (const role of createdRoles) {
          await role.delete().catch(() => undefined)
        }

        const category = findProjectCategory(guild, name)
        if (category) {
          for (const channel of guild.channels.cache
            .filter((channel) => channel.parentId === category.id)
            .values()) {
            await channel.delete().catch(() => undefined)
          }
          await category.delete().catch(() => undefined)
        }

        throw error
      }
    },
  )
}

export async function deleteProject(interaction: ChatInputCommandInteraction, name: string) {
  const guild = await requireGuild(interaction)
  if (!guild) return

  const { category, projectRole, maintainerRole } = findProject(guild, name)

  if (!category && !projectRole && !maintainerRole) {
    await replyEphemeral(interaction, `No project named **${name}** was found.`)
    return
  }

  await runDeferred(interaction, 'There was an error while deleting the project.', async () => {
    if (category) {
      const childChannels = guild.channels.cache.filter(
        (channel) => channel.parentId === category.id,
      )
      for (const channel of childChannels.values()) {
        await channel.delete().catch(() => undefined)
      }
      await category.delete().catch(() => undefined)
    }

    if (projectRole) await projectRole.delete().catch(() => undefined)
    if (maintainerRole) await maintainerRole.delete().catch(() => undefined)

    return `Project **${name}** has been deleted.`
  })
}

export async function toggleProjectVisibility(
  interaction: ChatInputCommandInteraction,
  name: string,
) {
  const guild = await requireGuild(interaction)
  if (!guild) return

  const project = await requireProject(interaction, guild, name)
  if (!project) return
  const { category, projectRole } = project

  await runDeferred(
    interaction,
    'There was an error while toggling the project visibility.',
    async () => {
      const isVisible = category.permissionOverwrites.cache
        .get(projectRole.id)
        ?.allow.has(PermissionFlagsBits.ViewChannel)

      await category.permissionOverwrites.edit(projectRole.id, {
        ViewChannel: isVisible ? null : true,
      })

      return `Project **${name}** is now ${isVisible ? 'hidden from' : 'visible to'} the ${ROLE_PROJECT_PREFIX} role.`
    },
  )
}

export async function toggleProjectArchive(interaction: ChatInputCommandInteraction, name: string) {
  const guild = await requireGuild(interaction)
  if (!guild) return

  const project = await requireProject(interaction, guild, name)
  if (!project) return
  const { category, projectRole } = project

  await runDeferred(
    interaction,
    'There was an error while toggling the project archive state.',
    async () => {
      const isArchived = category.permissionOverwrites.cache
        .get(projectRole.id)
        ?.deny.has(PermissionFlagsBits.SendMessages)

      await category.permissionOverwrites.edit(projectRole.id, {
        SendMessages: isArchived ? null : false,
        SendMessagesInThreads: isArchived ? null : false,
      })

      return `Project **${name}** is now ${isArchived ? 'unarchived (read-write)' : 'archived (read-only)'}.`
    },
  )
}
