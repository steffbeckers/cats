import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';
import store from '../store/index'

Vue.use(new VueSocketIO({
  debug: process.env.NODE_ENV !== 'production',
  connection: process.env.VUE_APP_SOCKETIO,
  vuex: {
    store,
    actionPrefix: "SOCKETIO_",
    mutationPrefix: "SOCKETIO_"
  }
}))
