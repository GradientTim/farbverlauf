import z from 'zod'
import { defineEnv } from 'envin'

export default defineEnv({
  shared: {
    BOT_TOKEN: z.string(),
    CLIENT_ID: z.string(),
    GUILD_ID: z.string(),
  },
  env: process.env,
})
