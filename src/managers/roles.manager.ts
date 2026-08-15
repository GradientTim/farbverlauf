import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js'

import { guild } from '~/index.ts'
import { CHANNEL_ROLES_ID } from '~/constants/channel.constants.ts'
import { ROLE_PROJECT_PREFIX } from '~/constants/role.constants.ts'

export async function sendChannelMessage() {
  const channel = await guild?.channels.fetch(CHANNEL_ROLES_ID)
  if (!channel || !channel.isTextBased()) return

  const previousMessages = await channel.messages.fetch({ limit: 10 })
  const previousMessage = previousMessages.find(
    (message) => message.author.id === guild?.client.user.id,
  )

  const roles = (await guild?.roles.fetch())?.filter((role) =>
    role.name.startsWith(ROLE_PROJECT_PREFIX),
  )

  if (!roles || roles.size === 0) {
    await previousMessage?.delete().catch(() => undefined)
    return
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('roles-select')
    .setPlaceholder('Select your project roles')
    .setMinValues(0)
    .setMaxValues(roles.size)
    .addOptions(
      roles.map((role) => ({
        label: role.name.slice(ROLE_PROJECT_PREFIX.length).trim(),
        value: role.id,
      })),
    )

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

  const payload = {
    embeds: [
      {
        title: '🎭 Project Roles',
        description:
          'Pick the projects you want to follow. Selecting or deselecting a role here ' +
          'instantly adds or removes it, no need to save.',
        color: 0x5865f2,
      },
    ],
    components: [row],
  }

  if (previousMessage) {
    await previousMessage.edit(payload)
  } else {
    await channel.send(payload)
  }
}
