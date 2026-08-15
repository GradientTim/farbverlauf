import { consola } from 'consola'

import { defineEvent } from '~/types/event.ts'
import { ROLE_PROJECT_PREFIX } from '~/constants/role.constants.ts'
import * as rolesManager from '~/managers/roles.manager.ts'

export default defineEvent({
  on: 'roleCreate',
  listener: async (role) => {
    if (!role.name.startsWith(ROLE_PROJECT_PREFIX)) return

    try {
      await rolesManager.sendChannelMessage()
    } catch (error: unknown) {
      consola.error(error)
    }
  },
})
