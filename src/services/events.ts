import { join } from 'node:path'
import { readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { consola } from 'consola'
import type { Client, ClientEvents } from 'discord.js'

import type { BotEvent } from '~/types/event.ts'

const eventsDir = join(__dirname, '..', 'events')
const eventFiles = await readdir(eventsDir, { recursive: true })

export async function registerEvents(client: Client) {
  for (const eventFile of eventFiles) {
    if (!eventFile.endsWith('.event.ts')) continue

    const eventPath = join(eventsDir, eventFile)
    const { default: event } = (await import(pathToFileURL(eventPath).href)) as {
      default: BotEvent<keyof ClientEvents>
    }

    if (!event) {
      consola.warn(`Event file ${eventFile} has no valid default export, skipping.`)
      continue
    }

    client.on(event.on, event.listener)
  }
}
