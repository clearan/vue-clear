import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import '@/assets/common.css'
import {generateRouter} from "@/libs/utils";

Vue.config.productionTip = false

router.beforeEach(async (to, from, next) => {
  if (!store.state.hasAuth) {
    await store.dispatch('setUserRouter')
    const newRoutes = generateRouter(store.state.userRouters)
    router.addRoutes(newRoutes);
    next({path: to.path})
  } else {
    next()
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
