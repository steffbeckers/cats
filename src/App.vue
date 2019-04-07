<template>
  <div id="app">
    <!-- Router outlet -->
    <router-view></router-view>
  </div>
</template>

<style lang="scss">
  body {
    margin: 0px;
    padding: 0px;
  }
</style>

<script>
export default {
  sockets: {
    connect() {
      this.$store.commit('SOCKETIO_CONNECT')
    },
    disconnect() {
      this.$store.commit('SOCKETIO_DISCONNECT')
    },
  },
  name: 'App'
}
</script>
