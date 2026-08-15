import { consola } from 'consola'

import { defineEvent } from '~/types/event.ts'
import { CHANNEL_HONEYPOT_ID } from '~/constants/channel.constants.ts'

export default defineEvent({
  on: 'messageCreate',
  listener: async (message) => {
    if (message.channelId !== CHANNEL_HONEYPOT_ID || message.author.bot || !message.inGuild()) {
      return
    }

    try {
      await message.delete()
      await message.member?.kick('Sent a message in the honeypot channel')
    } catch (error: unknown) {
      consola.error(error)
    }
  },
})
