import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
Vue.use(VueRouter)

const ifAuthenticated = (to, from, next) => {
  if (localStorage.getItem('isAuth')==="true"){
    next()
    return
  }
  next('/login')
}

const ifNotAuthenticated = (to, from, next) => {
  if (localStorage.getItem('isAuth')==="true"){
    next('/')
    return
  }
  next()
}
  const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: ifNotAuthenticated,
  },
  {
    path: '/register',
    name: 'Register',
    beforeEnter: ifNotAuthenticated,
    component: () => import( '../views/Register.vue'),
  },
  {
      path: '/',
      name: 'Home',
      component: Home,
      beforeEnter: ifAuthenticated,
  }

]

const router = new VueRouter({
  routes
})

export default router
