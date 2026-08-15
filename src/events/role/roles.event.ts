import { consola } from 'consola'
import { MessageFlagsBitField } from 'discord.js'

import { defineEvent } from '~/types/event.ts'
import { ROLE_PROJECT_PREFIX } from '~/constants/role.constants.ts'

export default defineEvent({
  on: 'interactionCreate',
  listener: async (interaction) => {
    if (
      !interaction.isStringSelectMenu() ||
      interaction.customId !== 'roles-select' ||
      !interaction.inCachedGuild()
    ) {
      return
    }

    const { member, values, guild } = interaction

    const projectRoles = guild.roles.cache.filter((role) =>
      role.name.startsWith(ROLE_PROJECT_PREFIX),
    )
    const selectedRoleIds = new Set(values)

    const rolesToAdd = projectRoles.filter(
      (role) => selectedRoleIds.has(role.id) && !member.roles.cache.has(role.id),
    )
    const rolesToRemove = projectRoles.filter(
      (role) => !selectedRoleIds.has(role.id) && member.roles.cache.has(role.id),
    )

    try {
      if (rolesToAdd.size > 0) await member.roles.add(rolesToAdd)
      if (rolesToRemove.size > 0) await member.roles.remove(rolesToRemove)

      await interaction.reply({
        content: 'Your project roles have been updated!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      })
    } catch (error: unknown) {
      consola.error(error)

      await interaction.reply({
        content: 'There was an error while updating your roles!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      })
    }
  },
})
