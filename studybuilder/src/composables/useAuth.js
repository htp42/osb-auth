/**
 * useAuth Composable
 * 
 * Purpose: After successful login with PocketBase, decode the JWT,
 * add the user's roles field from the login response, and create
 * a new custom JWT token for client-side role management.
 * 
 * Behavior:
 * 1. Authenticate user using PocketBase `authWithPassword`.
 * 2. Decode the returned JWT using browser-native base64.
 * 3. Merge the decoded payload with `roles` from `res.record.roles`.
 * 4. Create and store a new client-side JWT (not for server validation).
 * 5. Store both original and custom tokens in localStorage.
 * 6. Provide helper to decode and access roles for frontend use.
 * 
 * Constraints:
 * - The original PocketBase JWT is used for API calls.
 * - The custom JWT is only used for local UI/authorization.
 * - Uses browser-native APIs (no external JWT libraries needed).
 */

import { ref, computed } from 'vue'
import { pb } from '@/utils/pocketbase'

// Custom JWT header for browser-compatible implementation
const JWT_HEADER = {
  alg: 'HS256',
  typ: 'JWT'
}

// Storage keys
const STORAGE_KEYS = {
//  ORIGINAL_TOKEN: 'pb_original_token',
  CUSTOM_TOKEN: 'auth_token',
  USER_DATA: 'pb_user_data',
  USER_TYPE: 'pb_user_type'
}

// Reactive state
const currentUser = ref(null)
const customToken = ref(null)
const originalToken = ref(null)
const isAuthenticated = ref(false)

/**
 * Base64 URL encode (browser-native)
 * @param {string} str - String to encode
 * @returns {string} Base64 URL encoded string
 */
function base64UrlEncode(str) {
  const base64 = btoa(str)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Base64 URL decode (browser-native)
 * @param {string} str - Base64 URL encoded string
 * @returns {string} Decoded string
 */
function base64UrlDecode(str) {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }
  return atob(base64)
}

/**
 * Decode JWT token without verification (client-side inspection)
 * Uses browser-native base64 decoding
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded payload
 */
function decodeToken(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    // Decode the payload (second part)
    const payload = base64UrlDecode(parts[1])
    return JSON.parse(payload)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Create custom JWT with roles included (browser-compatible)
 * Note: This is NOT cryptographically secure and is for CLIENT-SIDE UI ONLY
 * @param {object} originalPayload - Original JWT payload from PocketBase
 * @param {array} roles - User roles array
 * @param {object} userData - Additional user data
 * @returns {string} Custom JWT token
 */
function createCustomToken(originalPayload, roles, userData) {
  console.log('=== createCustomToken DEBUG ===')
  console.log('originalPayload:', originalPayload)
  console.log('roles parameter:', roles)
  console.log('userData:', userData)
  
  // Merge original payload with roles and additional user info
  const customPayload = {
    ...originalPayload,
    roles: roles || [],
    name: userData.name || '',
    email: userData.email || '',
    role: userData.role, // numeric role (0=user, 1=admin, etc.)
    iat: Math.floor(Date.now() / 1000) // issued at
  }
  
  console.log('customPayload created:', customPayload)
  console.log('customPayload.roles:', customPayload.roles)

  // Create JWT structure (header.payload.signature)
  // Note: We're creating a "fake" signature since this is client-side only
  const headerEncoded = base64UrlEncode(JSON.stringify(JWT_HEADER))
  const payloadEncoded = base64UrlEncode(JSON.stringify(customPayload))
  
  console.log('Payload before encoding:', JSON.stringify(customPayload))
  console.log('Payload encoded:', payloadEncoded)
  
  // For client-side only, we just create a simple signature placeholder
  // This is NOT secure and should NEVER be used for server validation
  const signature = base64UrlEncode('client-side-signature')
  
  const token = `${headerEncoded}.${payloadEncoded}.${signature}`
  console.log('Final token:', token)
  console.log('=== END createCustomToken DEBUG ===')
  
  return token
}

/**
 * Login function for regular users
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Login result with success status
 */
export async function login(email, password) {
  try {
    // 1. Authenticate with PocketBase
    const authData = await pb.collection('users').authWithPassword(email, password)
    
    // 2. Get the original JWT token
    const pbToken = pb.authStore.token
    
    // 3. Decode the original token
    const decodedPayload = decodeToken(pbToken)
    
    if (!decodedPayload) {
      throw new Error('Failed to decode PocketBase token')
    }
    
    console.log('Original JWT Payload:', decodedPayload)
    
    // 4. Extract roles from the user record
    console.log('=== DEBUG: Full authData.record ===')
    console.log(authData.record)
    console.log('authData.record.roles:', authData.record.roles)
    
    const userRoles = authData.record.roles || []
    
    console.log('User Roles extracted:', userRoles)
    console.log('User Roles type:', typeof userRoles)
    console.log('User Roles is array?', Array.isArray(userRoles))
    
    // 5. Create custom JWT with roles included
    const customJWT = createCustomToken(decodedPayload, userRoles, authData.record)
    
    console.log('Custom JWT Created:', customJWT)
    const decodedCustom = decodeToken(customJWT)
    console.log('Custom JWT Decoded:', decodedCustom)
    console.log('Roles in custom JWT:', decodedCustom?.roles)
    
    // 6. Store both tokens in localStorage
//  localStorage.setItem(STORAGE_KEYS.ORIGINAL_TOKEN, pbToken)
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKEN, customJWT)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.record))
    localStorage.setItem(STORAGE_KEYS.USER_TYPE, 'user')
    
    // 7. Update reactive state
    currentUser.value = authData.record
    customToken.value = customJWT
    originalToken.value = pbToken
    isAuthenticated.value = true
    
    // Create enhanced response that mimics PocketBase API structure
    // but includes the custom token with roles
    const enhancedResponse = {
      success: true,
      token: customJWT,              // Custom JWT with roles (for client-side use)
      originalToken: pbToken,        // Original PocketBase JWT (for API calls)
      record: {
        ...authData.record,
        // Ensure roles are accessible
        roles: userRoles
      },
      // Include the original data for compatibility
      data: authData,
      userType: 'user',
      // Add decoded payload for easy access
      decodedToken: decodedCustom
    }
    
    return enhancedResponse
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error
    }
  }
}

/**
 * Login function for admin/superuser
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<object>} Login result with success status
 */
export async function adminLogin(email, password) {
  try {
    // 1. Authenticate with PocketBase as admin
    const authData = await pb.collection('_superusers').authWithPassword(email, password)
    
    // 2. Get the original JWT token
    const pbToken = pb.authStore.token
    
    // 3. Decode the original token
    const decodedPayload = decodeToken(pbToken)
    
    if (!decodedPayload) {
      throw new Error('Failed to decode PocketBase token')
    }
    
    console.log('Original Admin JWT Payload:', decodedPayload)
    
    // 4. Admins may not have roles array, default to ['admin']
    const userRoles = authData.record.roles || ['admin', 'superuser']
    
    console.log('Admin Roles:', userRoles)
    
    // 5. Create custom JWT with roles included
    const customJWT = createCustomToken(decodedPayload, userRoles, authData.record)
    
    console.log('Custom Admin JWT Created:', customJWT)
    console.log('Custom Admin JWT Decoded:', decodeToken(customJWT))
    
    // 6. Store both tokens in localStorage
    // localStorage.setItem(STORAGE_KEYS.ORIGINAL_TOKEN, pbToken)
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TOKEN, customJWT)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.record))
    localStorage.setItem(STORAGE_KEYS.USER_TYPE, 'admin')
    
    // 7. Update reactive state
    currentUser.value = authData.record
    customToken.value = customJWT
    originalToken.value = pbToken
    isAuthenticated.value = true
    
    // Create enhanced response for admin
    const decodedCustom = decodeToken(customJWT)
    
    const enhancedResponse = {
      success: true,
      token: customJWT,              // Custom JWT with roles (for client-side use)
      originalToken: pbToken,        // Original PocketBase JWT (for API calls)
      record: {
        ...authData.record,
        roles: userRoles
      },
      data: authData,
      userType: 'admin',
      decodedToken: decodedCustom
    }
    
    return enhancedResponse
  } catch (error) {
    console.error('Admin login error:', error)
    return {
      success: false,
      error
    }
  }
}

/**
 * Get user roles from custom token
 * @returns {array} Array of role strings
 */
export function getRoles() {
  // Try to get from custom token first
  if (customToken.value) {
    const decoded = decodeToken(customToken.value)
    return decoded?.roles || []
  }
  
  // Fallback to user data in localStorage
  const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
  if (storedUserData) {
    try {
      const userData = JSON.parse(storedUserData)
      return userData.roles || []
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }
  
  return []
}

/**
 * Check if user has specific role(s)
 * @param {string|array} requiredRoles - Single role or array of roles
 * @returns {boolean} True if user has any of the required roles
 */
export function isAuthorized(requiredRoles) {
  const userRoles = getRoles()
  
  // If no roles required, always authorized
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  
  // Convert to array if single string
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  
  // Check if user has any of the required roles
  return rolesArray.some(role => userRoles.includes(role))
}

/**
 * Check if user has ALL specified roles
 * @param {array} requiredRoles - Array of roles
 * @returns {boolean} True if user has all required roles
 */
export function hasAllRoles(requiredRoles) {
  const userRoles = getRoles()
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }
  
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  
  return rolesArray.every(role => userRoles.includes(role))
}

/**
 * Get the original PocketBase token (for API calls)
 * @returns {string|null} Original PocketBase JWT token
 */
export function getOriginalToken() {
  return originalToken.value || localStorage.getItem(STORAGE_KEYS.ORIGINAL_TOKEN)
}

/**
 * Get the custom token with roles (for client-side authorization)
 * @returns {string|null} Custom JWT token with roles
 */
export function getCustomToken() {
  return customToken.value || localStorage.getItem(STORAGE_KEYS.CUSTOM_TOKEN)
}

/**
 * Get decoded custom token payload
 * @returns {object|null} Decoded custom token payload
 */
export function getCustomTokenPayload() {
  const token = getCustomToken()
  return token ? decodeToken(token) : null
}

/**
 * Get current user data
 * @returns {object|null} Current user object
 */
export function getCurrentUser() {
  if (currentUser.value) {
    return currentUser.value
  }
  
  const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
  if (storedUserData) {
    try {
      return JSON.parse(storedUserData)
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }
  
  return null
}

/**
 * Logout function - clears all auth data
 */
export function logout() {
  // Clear PocketBase auth
  pb.authStore.clear()
  
  // Clear localStorage
  localStorage.removeItem(STORAGE_KEYS.ORIGINAL_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  localStorage.removeItem(STORAGE_KEYS.USER_TYPE)
  localStorage.removeItem('pocketbase_auth')
  
  // Clear reactive state
  currentUser.value = null
  customToken.value = null
  originalToken.value = null
  isAuthenticated.value = false
}

/**
 * Restore auth state from localStorage on app load
 */
export function restoreAuth() {
  const storedOriginalToken = localStorage.getItem(STORAGE_KEYS.ORIGINAL_TOKEN)
  const storedCustomToken = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOKEN)
  const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
  
  if (storedOriginalToken && storedCustomToken && storedUserData) {
    try {
      // Restore PocketBase auth store
      const userData = JSON.parse(storedUserData)
      pb.authStore.save(storedOriginalToken, userData)
      
      // Restore reactive state
      originalToken.value = storedOriginalToken
      customToken.value = storedCustomToken
      currentUser.value = userData
      isAuthenticated.value = true
      
      console.log('Auth restored from localStorage')
      console.log('Custom Token Payload:', decodeToken(storedCustomToken))
    } catch (error) {
      console.error('Error restoring auth:', error)
      logout()
    }
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function checkAuth() {
  return isAuthenticated.value || pb.authStore.isValid
}

/**
 * Vue composable hook
 * @returns {object} Auth methods and state
 */
export function useAuth() {
  return {
    // State
    currentUser: computed(() => currentUser.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    roles: computed(() => getRoles()),
    
    // Methods
    login,
    adminLogin,
    logout,
    getRoles,
    isAuthorized,
    hasAllRoles,
    getOriginalToken,
    getCustomToken,
    getCustomTokenPayload,
    getCurrentUser,
    restoreAuth,
    checkAuth
  }
}

// Export for non-composable usage
export default {
  login,
  adminLogin,
  logout,
  getRoles,
  isAuthorized,
  hasAllRoles,
  getOriginalToken,
  getCustomToken,
  getCustomTokenPayload,
  getCurrentUser,
  restoreAuth,
  checkAuth,
  useAuth
}

