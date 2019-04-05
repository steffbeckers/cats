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
    cat: JSON.parse(localStorage.getItem('cat')) || {},
    // Socket.io
    connected: false
  },
  mutations: {
    auth(state, credentials) {
      // Set state
      state.authenticated = true
      state.token = credentials.token
      state.cat = { id: credentials.id }

      // Save cat
      localStorage.setItem('cat', JSON.stringify(state.cat))

      // Save token
      localStorage.setItem('token', credentials.token)

      // Set Authorization token on request
      Vue.prototype.$axios.defaults.headers.common['Authorization'] = state.token
    },
    me(state, cat) {
      state.cat = cat

      // Save cat
      localStorage.setItem('cat', JSON.stringify(cat))
    },
    logout(state) {
      // Set state
      state.authenticated = false
      state.token = null
      state.cat = null

      // Remove from local storage
      localStorage.removeItem('token')
      localStorage.removeItem('cat')

      // Remove Authorization token on header
      delete Vue.prototype.$axios.defaults.headers.common['Authorization']
    },
    // Socket.io
    SOCKETIO_CONNECT(state) {
      state.connected = true
    },
    SOCKETIO_DISCONNECT(state) {
      state.connected = false
    }
  },
  actions: {
    auth({ commit, state }) {
      if (state.authenticated) {
        return;
      }

      Vue.prototype.$axios
        .post(process.env.VUE_APP_API + '/auth')
        .then((response) => {
          commit('auth', response.data)
        })
    },
    me({ commit }) {
      Vue.prototype.$axios
        .get(process.env.VUE_APP_API + '/me')
        .then((response) => {
          commit('me', response.data)
        })
    },
    logout({ commit }) {
      Vue.prototype.$axios
        .get(process.env.VUE_APP_API + '/logout')
        .then((response) => {
          commit('logout', response.data)
        })
    },
    updateCat({ commit }, cat) {
      Vue.prototype.$axios
        .put(process.env.VUE_APP_API + '/cat', cat)
        .then((response) => {
          if (response.replaced > 0) 
            commit('me', cat)
        })
    }
  }
})
