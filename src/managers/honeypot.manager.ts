import { guild } from '~/index.ts'
import { CHANNEL_HONEYPOT_ID } from '~/constants/channel.constants.ts'

export async function sendChannelEmbed() {
  const channel = await guild?.channels.fetch(CHANNEL_HONEYPOT_ID)
  if (!channel || !channel.isTextBased()) return

  const previousMessages = await channel.messages.fetch({ limit: 10 })
  if (previousMessages.size > 0) return

  await channel.send({
    embeds: [
      {
        title: '⚠️ DO NOT SEND MESSAGES IN THIS CHANNEL ⚠️',
        description:
          'This channel is used to catch **spam/scam** bots.\n' +
          '**Any message** sent in this channel will result in a **server kick**.',
        color: 0xed4245,
      },
    ],
  })
}
