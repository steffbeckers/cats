<template>
  <div id="app">
    <!-- Router outlet -->
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  mounted() {
    this.authenticate()
  },
  methods: {
    authenticate() {
      if (this.$store.state.authenticated) {
        return;
      }

      this.$axios
        .post(process.env.VUE_APP_API + '/auth')
        .then((response) => {
          this.$store.commit('authenticate', response.data)

          // Navigate to cat
          this.$router.push({ path: '/' + this.$store.state.cat.id })
        })
        .catch(error => {
          this.$logger.error(error)
        })
    }
  },
  name: 'App'
}
</script>
