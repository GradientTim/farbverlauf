import { MessageFlagsBitField, PermissionsBitField, SlashCommandBuilder } from 'discord.js'

import { shutdown } from '~/index.ts'
import { defineCommand } from '~/types/command.ts'

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('exit')
    .setDescription('Disconnect the bot')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    await interaction.reply({ content: 'Bye!', flags: MessageFlagsBitField.Flags.Ephemeral })
    await shutdown()
  },
})
