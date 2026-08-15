import { consola } from 'consola'
import { Client, Events, type Guild } from 'discord.js'

import env from '~/env.ts'

import { registerEvents } from '~/services/events.ts'
import { registerCommands } from '~/services/commands.ts'

import * as rolesManager from '~/managers/roles.manager.ts'
import * as verifyManager from '~/managers/verify.manager.ts'
import * as honeypotManager from '~/managers/honeypot.manager.ts'

export const client = new Client({
  intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildModeration'],
})

export let guild: Guild | null = null

client.once(Events.ClientReady, async () => {
  consola.info('Client is ready!')

  try {
    guild = await client.guilds.fetch(env.GUILD_ID)

    await rolesManager.sendChannelMessage()
    await verifyManager.sendChannelMessage()
    await honeypotManager.sendChannelEmbed()

    await registerEvents(client)
    await registerCommands(client)
  } catch (error: unknown) {
    consola.error('Failed to initialize after ready:', error)
    process.exit(1)
  }
})

async function initialize() {
  try {
    await client.login(env.BOT_TOKEN)
  } catch (error: unknown) {
    consola.error('Failed to log in:', error)
    process.exit(1)
  }
}

export async function shutdown() {
  try {
    consola.info('Shutting down...')
    await client.destroy()
  } catch (error: unknown) {
    consola.error('Error during shutdown:', error)
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await initialize()
