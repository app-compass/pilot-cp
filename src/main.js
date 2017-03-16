/* global localStorage: false */
var Vue = require('vue')
var VueRouter = require('vue-router')
// var VueResource = require('vue-resource')

import axios from 'axios'
import VueAxios from 'vue-axios'
import swal from 'sweetalert'
import Auth from './components/Auth'

import routes from './routes'
import App from './App'

import '../src/assets/sass/main.sass'
import moment from 'moment'

Vue.use(VueRouter)
// Vue.use(VueResource)
Vue.use(VueAxios, axios)

// Vue.axios.defaults.baseURL = process.env.API_SERVER
Vue.axios.defaults.headers.common['X-Csrf-Token'] = localStorage.getItem('csrf_token') || ''
Vue.axios.defaults.headers.common['Authorization'] = localStorage.getItem('auth_token') || ''
// Vue.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
// Vue.axios.options.root = ''

Vue.axios.interceptors.response.use(function (response) {
  if (response.headers['authorization']) {
    localStorage.setItem('auth_token', response.headers['authorization'])
    Vue.axios.defaults.headers.common['Authorization'] = response.headers['authorization']
  }
  return response
}, function (error) {
  if (error.response) {
    if (error.response.status === 401) {
      return Auth.logout()
    }
    if (error.response.status === 403) {
      swal('Unauthorized', error.response.data || 'You are not authorized to perform this action.', 'error')
    }
    if (error.response.status === 404) {
      swal('Not Found', error.response.data || 'Resource not found.', 'error')
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message)
  }
  return Promise.reject(error)
})

// Vue.axios.interceptors.push((request, next) => {
//   next(response => {
//     if (response.headers.has('authorization')) {
//       let token = response.headers.get('authorization').slice(8)
//       localStorage.setItem('auth_token', token)
//       Vue.axios.defaults.headers.common['Authorization'] = response.headers.get('authorization')
//     }

//     if (response.status === 401) {
//       return Auth.logout()
//     }
//     if (response.status === 403) {
//       swal('Unauthorized', response.data.error || 'You are not authorized to perform this action.', 'error')
//     }
//     if (response.status === 404) {
//       swal('Not Found', response.data.error || 'Resource not found.', 'error')
//     }

//     return response
//   })
// })

Vue.directive('moment-ago', {
  bind (el, binding) {
    el.innerHTML = ' ' + moment(binding.value, 'YYYY-MM-DD HH:mm:ss').fromNow()
    el.interval = setInterval(() => {
      el.innerHTML = ' ' + moment(binding.value, 'YYYY-MM-DD HH:mm:ss').fromNow()
    }, 1000)
  },
  update (el, binding) {
    clearInterval(el.interval)
    el.innerHTML = ' ' + moment(binding.value, 'YYYY-MM-DD HH:mm:ss').fromNow()
    el.interval = setInterval(() => {
      el.innerHTML = ' ' + moment(binding.value, 'YYYY-MM-DD HH:mm:ss').fromNow()
    }, 1000)
  },
  unbind (el, binding, vnode) {
    clearInterval(el.interval)
  }
})

export default Vue

export var router = new VueRouter({
  mode: 'history',
  routes
})

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  template: '<App/>',
  components: { App },
  created () {
    this.csrf()
  },
  methods: {
    csrf () {
      this.$http.get('/api/web-forms/token')
        .then((response) => {
          localStorage.setItem('csrf_token', response.data)
          Vue.axios.defaults.headers.common['X-Csrf-Token'] = response.data
        })
    }
  }

  // mounted: function() {
  //   // this.csrf()
  // }
})
