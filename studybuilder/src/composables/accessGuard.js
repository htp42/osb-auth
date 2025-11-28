import { inject, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getRoles, isAuthorized } from '@/composables/useAuth'

export function useAccessGuard() {
  const authStore = useAuthStore()

  /**
   * Check if user has a specific permission/role
   * Works with both OAuth and PocketBase authentication
   * @param {string|array} permission - Single permission or array of permissions
   * @returns {boolean} True if user has the permission
   */
  function checkPermission(permission) {
    const $config = inject('$config')
    
    // OAuth RBAC check
    if ($config.OAUTH_ENABLED && $config.OAUTH_RBAC_ENABLED) {
      const roles = authStore.userRoles
      if (!roles || roles.length === 0) {
        console.warn('No roles found in OAuth user info')
        return false
      }
      
      // Support both single permission and array of permissions
      if (Array.isArray(permission)) {
        return permission.some(p => roles.includes(p))
      }
      return roles.includes(permission)
    }
    
    // PocketBase role check
    const pbRoles = getRoles()
    if (pbRoles && pbRoles.length > 0) {
      return isAuthorized(permission)
    }
    
    // If no RBAC is enabled, allow access by default
    return true
  }

  /**
   * Check if user has ALL specified permissions
   * @param {array} permissions - Array of permissions
   * @returns {boolean} True if user has all permissions
   */
  function checkAllPermissions(permissions) {
    if (!Array.isArray(permissions)) {
      return checkPermission(permissions)
    }
    
    return permissions.every(permission => checkPermission(permission))
  }

  /**
   * Get all user roles
   * @returns {array} Array of user roles
   */
  function getUserRoles() {
    return authStore.userRoles
  }

  return {
    userInfo: computed(() => authStore.completeUserInfo),
    userRoles: computed(() => authStore.userRoles),
    checkPermission,
    checkAllPermissions,
    getUserRoles,
  }
}
