import {
  PermissionsBitField,
  SlashCommandBuilder,
  type SlashCommandSubcommandBuilder,
} from 'discord.js'

import { defineCommand } from '~/types/command.ts'
import {
  createProject,
  deleteProject,
  toggleProjectArchive,
  toggleProjectVisibility,
} from '~/managers/project.manager.ts'

function addNameOption(subcommand: SlashCommandSubcommandBuilder) {
  return subcommand.addStringOption((option) =>
    option.setName('name').setDescription('The project name').setRequired(true),
  )
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('project')
    .setDescription('Manage projects')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand((subcommand) =>
      addNameOption(subcommand.setName('create').setDescription('Create a project')),
    )
    .addSubcommand((subcommand) =>
      addNameOption(subcommand.setName('delete').setDescription('Delete a project')),
    )
    .addSubcommand((subcommand) =>
      addNameOption(
        subcommand
          .setName('toggle-visible')
          .setDescription('Show or hide a project from its Project role'),
      ),
    )
    .addSubcommand((subcommand) =>
      addNameOption(
        subcommand
          .setName('toggle-archive')
          .setDescription('Archive or unarchive a project (read-only for its Project role)'),
      ),
    ),
  async execute(interaction) {
    const name = interaction.options.getString('name', true)

    switch (interaction.options.getSubcommand()) {
      case 'create':
        await createProject(interaction, name)
        break
      case 'delete':
        await deleteProject(interaction, name)
        break
      case 'toggle-visible':
        await toggleProjectVisibility(interaction, name)
        break
      case 'toggle-archive':
        await toggleProjectArchive(interaction, name)
        break
    }
  },
})
