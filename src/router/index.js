import Vue from 'vue'
import Router from 'vue-router'

// Pages
const Home = () => import('@/pages/Home')
const Game = () => import('@/pages/Game')
// const Cat = () => import('@/pages/Cat')

// Errors
const Error404 = () => import('@/errors/404')

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    // Cat
    // {
    //   path: '/cat/:id',
    //   name: 'Cat',
    //   component: Cat
    // },
    // Game
    {
      path: '/:id',
      name: 'Game',
      component: Game
    },
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
