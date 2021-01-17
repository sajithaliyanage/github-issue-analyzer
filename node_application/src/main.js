import Vue from 'vue'
import App from './App.vue'
import { BContainer, BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import axios from 'axios'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.prototype.$http = axios;
Vue.config.productionTip = false;
Vue.component('b-container', BContainer);
// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

new Vue({
  render: h => h(App),
}).$mount('#app');
