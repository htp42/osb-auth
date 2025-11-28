<template>
  <div class="login-container">
    <!-- Main Content -->
    <div class="login-content">
      <!-- Logo and Title Section -->
      <div class="text-center mb-8">
        <div class="logo-section mb-6">
          <div class="logo-text">
            <img class="logoSrc" src="../assets/study_builder_homepage_logo.png" alt="StudyBuilder Logo" />
            
          </div>
        </div>
        <h1 class="welcome-title">Welcome to the StudyBuilder application</h1>
        
      </div>

      <!-- Login Card -->
      <v-card 
        elevation="12" 
        max-width="450" 
        class="mx-auto pa-8 login-card"
        rounded="xl"
      >
        <div v-if="!showForgotPassword">
          <!-- Login Form -->
          <div class="text-h5 mb-2 text-center font-weight-bold">Sign In</div>
          <div class="text-body-2 mb-4 text-center text-grey-darken-1">
            Enter your credentials to continue
          </div>

          <!-- Admin Login Toggle -->
          <div class="d-flex justify-center align-center mb-4">
            <v-btn-toggle
              v-model="loginType"
              mandatory
              color="primary"
              variant="outlined"
              divided
            >
              <v-btn value="user" size="small">
                <v-icon start>mdi-account</v-icon>
                User Login
              </v-btn>
              <v-btn value="admin" size="small">
                <v-icon start>mdi-shield-crown</v-icon>
                Admin Login
              </v-btn>
            </v-btn-toggle>
          </div>

          <v-form ref="loginForm" v-model="isValid" @submit.prevent="onSubmit">
            <v-text-field
              v-model="email"
              label="Email Address"
              type="email"
              :rules="emailRules"
              autocomplete="email"
              variant="outlined"
              prepend-inner-icon="mdi-email-outline"
              required
              class="mb-2"
            />
            <v-text-field
              v-model="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              :rules="passwordRules"
              autocomplete="current-password"
              variant="outlined"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              required
              class="mb-2"
            />

            <div class="d-flex justify-end mb-4">
              <a 
                href="#" 
                 @click="showForgotPassword = true"
                class="text-primary text-decoration-none"
              >
                Forgot Password?
              </a>
            </div>

            <v-btn
              color="primary"
              size="large"
              block
              type="submit"
              :loading="submitting"
              class="text-capitalize mb-3"
              elevation="2"
            >
              Sign In
            </v-btn>

            <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-3">
              {{ errorMessage }}
            </v-alert>
          </v-form>
        </div>

        <!-- Forgot Password Form -->
        <div v-else>
          <div class="text-h5 mb-2 text-center font-weight-bold">Reset Password</div>
          <div class="text-body-2 mb-6 text-center text-grey-darken-1">
            Enter your email address and we'll send you a reset link
          </div>

          <v-form ref="resetForm" v-model="resetFormValid" @submit.prevent="onResetPassword">
            <v-text-field
              v-model="resetEmail"
              label="Email Address"
              type="email"
              :rules="emailRules"
              autocomplete="email"
              variant="outlined"
              prepend-inner-icon="mdi-email-outline"
              required
              class="mb-4"
            />

            <v-btn
              color="primary"
              size="large"
              block
              type="submit"
              :loading="resetting"
              class="text-capitalize mb-3"
              elevation="2"
            >
              Send Reset Link
            </v-btn>

            <v-btn
              variant="text"
              block
              @click="showForgotPassword = false; resetMessage = ''; resetEmail = ''"
              class="text-capitalize"
            >
              Back to Sign In
            </v-btn>

            <v-alert v-if="resetMessage" :type="resetMessageType" variant="tonal" class="mt-3">
              {{ resetMessage }}
            </v-alert>
          </v-form>
        </div>
      </v-card>

      <!-- Footer -->
      <div class="text-center mt-8 footer-text">
        <div class="feature-items">
          <div class="feature-item">
            <v-icon size="small" class="mr-1" color="white">mdi-check-circle</v-icon>
            Build your study in a consistent way
          </div>
          <div class="feature-item">
            <v-icon size="small" class="mr-1" color="white">mdi-check-circle</v-icon>
            Comply with standards including CDISC
          </div>
          <div class="feature-item">
            <v-icon size="small" class="mr-1" color="white">mdi-check-circle</v-icon>
            Reuse specification elements across studies
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { pb } from '@/utils/pocketbase'
import { login, adminLogin, checkAuth, getCustomTokenPayload } from '@/composables/useAuth'

export default {
  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },
  data() {
    return {
      email: '',
      password: '',
      isValid: false,
      submitting: false,
      errorMessage: '',
      showPassword: false,
      showForgotPassword: false,
      loginType: 'user', // 'user' or 'admin'
      resetEmail: '',
      resetFormValid: false,
      resetting: false,
      resetMessage: '',
      resetMessageType: 'success',
      emailRules: [
        (v) => !!v || 'Email is required',
        (v) => /.+@.+\..+/.test(v) || 'Must be a valid email',
      ],
      passwordRules: [
        (v) => !!v || 'Password is required',
        (v) => (v && v.length >= 6) || 'Min 6 characters',
      ],
    }
  },
  mounted() {
    console.log('=== LoginPage MOUNTED ===')
    console.log('PocketBase URL:', pb.baseUrl)
    
    // Check if already authenticated
    if (checkAuth()) {
      console.log('Already authenticated, redirecting to home...')
      this.$router.push({ name: 'Studies' })
    }
  },
  methods: {
    async onSubmit() {
      this.errorMessage = ''
      const form = this.$refs.loginForm
      if (!form) return
      const { valid } = await form.validate()
      if (!valid) return
      
      this.submitting = true
      try {
        console.log('Attempting to authenticate with PocketBase...')
        console.log('Login Type:', this.loginType)
        console.log('Email:', this.email)
        
        // Authenticate with PocketBase using appropriate helper function
        let result
        if (this.loginType === 'admin') {
          console.log('Using admin/superuser authentication (_superusers collection)')
          result = await adminLogin(this.email, this.password)
        } else {
          console.log('Using regular user authentication (users collection)')
          result = await login(this.email, this.password)
        }
        
        if (result.success) {
          console.log('✅ Authentication successful!')
          console.log('\n=== ENHANCED API RESPONSE ===')
          console.log('Response structure (mimics PocketBase but with custom JWT):')
          console.log(JSON.stringify({
            success: result.success,
            token: result.token.substring(0, 50) + '...',
            originalToken: result.originalToken.substring(0, 50) + '...',
            record: {
              id: result.record.id,
              email: result.record.email,
              name: result.record.name,
              roles: result.record.roles
            },
            userType: result.userType
          }, null, 2))
          
          console.log('\n=== TOKEN COMPARISON ===')
          console.log('1️⃣ result.token (Custom JWT with roles):')
          console.log('   Token:', result.token.substring(0, 60) + '...')
          console.log('   Decoded:', result.decodedToken)
          console.log('   ✅ Use for: Client-side role checks, UI authorization')
          console.log('   🔐 Roles included:', result.decodedToken?.roles)
          
          console.log('\n2️⃣ result.originalToken (PocketBase JWT):')
          console.log('   Token:', result.originalToken.substring(0, 60) + '...')
          console.log('   ✅ Use for: API calls to PocketBase')
          console.log('   ⚠️  No roles in payload (by design)')
          
          console.log('\n=== USER INFO ===')
          console.log('User ID:', result.record.id)
          console.log('Email:', result.record.email)
          console.log('Name:', result.record.name)
          console.log('Roles:', result.record.roles)
          console.log('Type:', result.userType)
          
          console.log('\n=== DECODED CUSTOM JWT PAYLOAD ===')
          console.log(JSON.stringify(result.decodedToken, null, 2))
          console.log('===================================\n')
          
          // Redirect to home page (Studies)
          this.$router.push({ name: 'Studies' })
        } else {
          throw result.error
        }
        
      } catch (error) {
        console.error('Login error:', error)
        
        // Handle specific error messages
        if (error.status === 400) {
          const loginTypeText = this.loginType === 'admin' ? 'admin' : 'user'
          this.errorMessage = `Invalid ${loginTypeText} credentials. Please try again.`
        } else if (error.status === 404) {
          this.errorMessage = this.loginType === 'admin' 
            ? 'Admin authentication endpoint not found. Make sure you are using PocketBase admin credentials.'
            : 'User authentication endpoint not found.'
        } else if (error.status === 0 || error.message.includes('fetch')) {
          this.errorMessage = 'Cannot connect to authentication server. Please check if PocketBase is running on http://127.0.0.1:8090'
        } else {
          this.errorMessage = error.message || 'Login failed. Please try again.'
        }
      } finally {
        this.submitting = false
      }
    },
    
    goToForgot() {
      this.$router.push({ name: 'ForgotPassword' })
    },
    
    async onResetPassword() {
      this.resetMessage = ''
      const form = this.$refs.resetForm
      if (!form) return
      const { valid } = await form.validate()
      if (!valid) return
      
      this.resetting = true
      try {
        console.log('Requesting password reset for:', this.resetEmail)
        
        // Request password reset from PocketBase
        await pb.collection('users').requestPasswordReset(this.resetEmail)
        
        console.log('Password reset email sent successfully')
        this.resetMessageType = 'success'
        this.resetMessage = 'Password reset link has been sent to your email. Please check your inbox.'
        
        // Clear the email field after success
        setTimeout(() => {
          this.resetEmail = ''
        }, 3000)
        
      } catch (error) {
        console.error('Password reset error:', error)
        
        // PocketBase returns success even if email doesn't exist (for security)
        // But we'll handle any actual errors
        if (error.status === 0 || error.message.includes('fetch')) {
          this.resetMessageType = 'error'
          this.resetMessage = 'Cannot connect to server. Please check if PocketBase is running.'
        } else {
          // Usually PocketBase returns success for security reasons
          this.resetMessageType = 'success'
          this.resetMessage = 'If this email exists, a password reset link will be sent shortly.'
        }
      } finally {
        this.resetting = false
      }
    },
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #193074;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.logoSrc{
  width: 75% !important;
}
.login-content {
  width: 100%;
  max-width: 600px;
}

.logo-section {
  margin-bottom: 2rem;
}

.logo-text {
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
}

.open-text {
  font-size: 2.5rem;
  color: #a8c5dd;
  letter-spacing: 0.1em;
}

.study-text {
  font-size: 3rem;
  color: #ffffff;
  letter-spacing: 0.05em;
}

.builder-text {
  font-size: 3rem;
  color: #ffffff;
  letter-spacing: 0.05em;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 400;
  color: #ffffff;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: #b8d4ea;
  font-weight: 300;
}

.login-card {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
}

.footer-text {
  color: #ffffff;
}

.feature-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #e0e8f0;
}

@media (max-width: 600px) {
  .open-text {
    font-size: 2rem;
  }
  
  .study-text,
  .builder-text {
    font-size: 2.5rem;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .welcome-subtitle {
    font-size: 1.1rem;
  }
}
</style>
