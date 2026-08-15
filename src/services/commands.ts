import { join } from 'node:path'
import { readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { consola } from 'consola'
import { type Client, Collection, MessageFlagsBitField, REST, Routes } from 'discord.js'

import env from '~/env.ts'
import type { BotCommand } from '~/types/command.ts'

const commandsDir = join(__dirname, '..', 'commands')
const commandFiles = await readdir(commandsDir, { recursive: true })

async function loadCommands() {
  const commands = new Collection<string, BotCommand>()

  for (const commandFile of commandFiles) {
    if (!commandFile.endsWith('.command.ts')) continue

    const commandPath = join(commandsDir, commandFile)
    const { default: command } = (await import(pathToFileURL(commandPath).href)) as {
      default: BotCommand
    }

    if (!command) {
      consola.warn(`Command file ${commandFile} has no valid default export, skipping.`)
      continue
    }

    commands.set(command.data.name, command)
  }

  await deployCommands(commands)

  return commands
}

export async function registerCommands(client: Client) {
  client.commands = await loadCommands()

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    const command = interaction.client.commands.get(interaction.commandName)

    if (!command) {
      consola.error(`No command matching ${interaction.commandName} was found.`)
      return
    }

    try {
      await command.execute(interaction)
    } catch {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        })
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        })
      }
    }
  })
}

async function deployCommands(commands: Collection<string, BotCommand>) {
  const rest = new REST().setToken(env.BOT_TOKEN)
  const body = commands.map((command) => command.data.toJSON())

  await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body })
  consola.success(`Deployed ${body.length} application command(s) to guild ${env.GUILD_ID}.`)
}
