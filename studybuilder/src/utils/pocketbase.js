import PocketBase from 'pocketbase'
import { ref } from 'vue'

// Initialize PocketBase instance
export const pb = new PocketBase(process.env.POCKETBASE_PATH)

// Enable auto cancellation for requests
pb.autoCancellation(false)

// Create reactive state for auth - initialize with current auth model
export const currentUser = ref(pb.authStore.model)
export const isAuthenticatedRef = ref(pb.authStore.isValid)

// Update reactive state when auth changes
pb.authStore.onChange((token, model) => {
  currentUser.value = model
  isAuthenticatedRef.value = pb.authStore.isValid
})

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return pb.authStore.isValid
}

// Helper function to get current user (reactive)
export const getCurrentUser = () => {
  return currentUser.value || pb.authStore.record
}

// Helper function to get auth token
export const getAuthToken = () => {
  return pb.authStore.token
}

// Helper function to logout
export const logout = () => {
  pb.authStore.clear()
  localStorage.removeItem('pocketbase_auth')
  currentUser.value = null
  isAuthenticatedRef.value = false
}

// Helper function to login (regular users)
export const login = async (email, password) => {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password)
    
    // Store auth data in localStorage for persistence
    localStorage.setItem('pocketbase_auth', JSON.stringify({
      token: pb.authStore.token,
      userId: pb.authStore.model.id,
      userData: authData.record,
      userType: 'user'
    }))
    
    return { success: true, data: authData, userType: 'user' }
  } catch (error) {
    return { success: false, error }
  }
}

// Helper function to login as admin/superuser
export const adminLogin = async (email, password) => {
  try {
    // Use the _superusers collection for admin authentication
    const authData = await pb.collection('_superusers').authWithPassword(email, password)
    
    // Store admin auth data in localStorage for persistence
    localStorage.setItem('pocketbase_auth', JSON.stringify({
      token: pb.authStore.token,
      userId: pb.authStore.model.id,
      userData: authData.record,
      userType: 'admin'
    }))
    
    return { success: true, data: authData, userType: 'admin' }
  } catch (error) {
    return { success: false, error }
  }
}

// Restore auth state from localStorage on app load
export const restoreAuth = () => {
  const stored = localStorage.getItem('pocketbase_auth')
  if (stored) {
    try {
      const { token, userData } = JSON.parse(stored)
      pb.authStore.save(token, userData)
      currentUser.value = pb.authStore.model
      isAuthenticatedRef.value = pb.authStore.isValid
    } catch (error) {
      console.error('Error restoring auth:', error)
      localStorage.removeItem('pocketbase_auth')
    }
  }
}

export default pb

