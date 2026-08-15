import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { guild } from '~/index.ts'
import { CHANNEL_VERIFY_ID } from '~/constants/channel.constants.ts'

export async function sendChannelMessage() {
  const channel = await guild?.channels.fetch(CHANNEL_VERIFY_ID)
  if (!channel || !channel.isTextBased()) return

  const previousMessages = await channel.messages.fetch({ limit: 10 })
  if (previousMessages.size > 0) return

  const verifyButton = new ButtonBuilder()
    .setCustomId('verify')
    .setLabel('Verify')
    .setEmoji('✅')
    .setStyle(ButtonStyle.Success)

  const leaveButton = new ButtonBuilder()
    .setCustomId('verify-leave')
    .setLabel("I don't want to be here")
    .setEmoji('🚪')
    .setStyle(ButtonStyle.Danger)

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton, leaveButton)

  await channel.send({
    embeds: [
      {
        title: 'Verify yourself',
        description:
          "Welcome! Before you can see the rest of the server, you need to confirm you're a real person.\n\n" +
          '**How it works:**\n' +
          '• Click the **Verify** button below\n' +
          "• You'll instantly receive the **Member** role\n" +
          '• All public channels will unlock right away\n\n' +
          "⚠️ Not interested? **I don't want to be here** will kick you from the server, so use it only if you mean it.",
        color: 0x3ba55d,
      },
    ],
    components: [row],
  })
}
