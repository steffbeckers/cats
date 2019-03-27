import Vue from 'vue'
import App from './App.vue'

import store from './store'
import router from './router'
import './plugins/logger'
import './plugins/axios'
import VueAnalytics from 'vue-analytics'
import './plugins/service-worker'

// Google Analytics
if (process.env.NODE_ENV === 'production') {
  Vue.use(VueAnalytics, {
    id: 'UA-101766005-5',
    router
  })
}

// Guards
// router.beforeEach((to, from, next) => {
// })

// Set Authorization header, if token exists
var token = localStorage.getItem('token')
if (token) {
  Vue.prototype.$axios.defaults.headers.common['Authorization'] = token
}

// Vue's production tip
Vue.config.productionTip = false

// Lauch the Vue rocket
new Vue({
  render: h => h(App),
  router,
  store
}).$mount('#app')
