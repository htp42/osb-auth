import { defineStore } from 'pinia'

import { auth } from '@/plugins/auth'
import { getRoles, getCustomTokenPayload, getCurrentUser } from '@/composables/useAuth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: null,
    displayWelcomeMsg: false,
  }),

  getters: {
    // Get roles from either OAuth or PocketBase auth
    userRoles: (state) => {
      // Try OAuth userInfo first (for OAuth flow)
      if (state.userInfo?.roles && Array.isArray(state.userInfo.roles)) {
        return state.userInfo.roles
      }
      // Fallback to PocketBase custom token roles
      const pbRoles = getRoles()
      if (pbRoles && pbRoles.length > 0) {
        return pbRoles
      }
      // Fallback to user record roles
      const currentUser = getCurrentUser()
      if (currentUser?.roles && Array.isArray(currentUser.roles)) {
        return currentUser.roles
      }
      return []
    },
    
    // Get complete user info from either auth system
    completeUserInfo: (state) => {
      if (state.userInfo) {
        return state.userInfo
      }
      // Try PocketBase custom token
      const tokenPayload = getCustomTokenPayload()
      if (tokenPayload) {
        return tokenPayload
      }
      // Try PocketBase user record
      return getCurrentUser()
    }
  },

  actions: {
    async initialize() {
      // Try OAuth first
      const userInfo = await auth.getUserInfo()
      if (userInfo) {
        this.userInfo = userInfo
        return
      }
      
      // Fallback to PocketBase if available
      const pbUser = getCurrentUser()
      if (pbUser) {
        const tokenPayload = getCustomTokenPayload()
        this.userInfo = {
          ...pbUser,
          ...tokenPayload,
          roles: tokenPayload?.roles || pbUser?.roles || []
        }
      }
    },
    
    setUserInfo(userInfo) {
      this.userInfo = userInfo
    },
    
    setWelcomeMsgFlag(value) {
      this.displayWelcomeMsg = value
    },
    
    clearUserInfo() {
      this.userInfo = null
    },
  },
})
