import { consola } from 'consola'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlagsBitField } from 'discord.js'

import { defineEvent } from '~/types/event.ts'
import { ROLE_MEMBER_ID } from '~/constants/role.constants.ts'
import { CHANNEL_VERIFY_ID } from '~/constants/channel.constants.ts'

export default defineEvent({
  on: 'interactionCreate',
  listener: async (interaction) => {
    if (
      interaction.channelId !== CHANNEL_VERIFY_ID ||
      !interaction.isButton() ||
      !interaction.inCachedGuild()
    ) {
      return
    }

    const { member, customId } = interaction

    if (customId === 'verify-leave') {
      const confirmButton = new ButtonBuilder()
        .setCustomId('verify-leave-confirm')
        .setLabel('Yes, kick me')
        .setStyle(ButtonStyle.Danger)

      const cancelButton = new ButtonBuilder()
        .setCustomId('verify-leave-cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton)

      await interaction.reply({
        content:
          '⚠️ **Are you sure?** This will kick you from the server. You can rejoin later with an invite.',
        components: [row],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      })
      return
    }

    if (customId === 'verify-leave-cancel') {
      await interaction.update({
        content: 'Phew, that was close! 😄',
        components: [],
      })
      return
    }

    if (customId === 'verify-leave-confirm') {
      try {
        await interaction.update({
          content: 'Alright, see you around! 👋',
          components: [],
        })
        await member.kick('Clicked "I don\'t want to be here"')
      } catch (error: unknown) {
        consola.error(error)
      }
      return
    }

    if (customId === 'verify') {
      if (member.roles.cache.has(ROLE_MEMBER_ID)) {
        await interaction.reply({
          content: 'You are already verified!',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        })
        return
      }

      try {
        await member.roles.add(ROLE_MEMBER_ID)

        await interaction.reply({
          content: 'You are now verified!',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        })
      } catch (error: unknown) {
        consola.error(error)

        await interaction.reply({
          content: 'There was an error while verifying you!',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        })
      }
      return
    }

    await interaction.reply({
      content: `Unknown action: '{${customId}}'`,
      flags: MessageFlagsBitField.Flags.Ephemeral,
    })
  },
})
