import Vue from 'vue'
import Router from 'vue-router'

// Pages
const Home = () => import('@/pages/Home')

// Errors
const Error404 = () => import('@/errors/404')

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    // Root
    {
      path: '/',
      name: 'Root',
      component: Home
    },
    // Errors
    {
      path: '*',
      name: '404',
      component: Error404
    }
  ]
})
