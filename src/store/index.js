import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// Default
export default new Vuex.Store({
  state: {
    // Env
    env: process.env.NODE_ENV,
    debug: localStorage.getItem('debug') || process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development',
    buildDateTime: process.env.VUE_APP_BUILD_DATETIME,
    // Auth
    authenticated: localStorage.getItem('token') !== null,
    token: localStorage.getItem('token'),
    cat: JSON.parse(localStorage.getItem('cat'))
  },
  mutations: {
    authenticate(state, credentials) {
      // Set state
      state.authenticated = true
      state.token = credentials.token
      state.cat = credentials.cat

      // Save cat
      localStorage.setItem('cat', JSON.stringify(state.cat))

      // Save token
      localStorage.setItem('token', credentials.token)

      // Set Authorization token on request
      Vue.prototype.$axios.defaults.headers.common['Authorization'] = state.token
    },
    signOut(state) {
      // Set state
      state.authenticated = false
      state.token = null
      state.cat = null

      // Remove from local storage
      localStorage.removeItem('token')
      localStorage.removeItem('cat')

      // Remove Authorization token on header
      delete Vue.prototype.$axios.defaults.headers.common['Authorization']
    }
  }
})
