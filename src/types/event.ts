import type { ClientEvents } from 'discord.js'

export interface BotEvent<Event extends keyof ClientEvents = keyof ClientEvents> {
  on: Event
  listener(...args: ClientEvents[Event]): Promise<void> | void
}

export function defineEvent<Event extends keyof ClientEvents>(event: BotEvent<Event>) {
  return event
}
