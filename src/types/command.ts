import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder
  execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void
}

export function defineCommand(command: BotCommand) {
  return command
}
