<template>
  <div>
    <h1>Let's play cat and mouse!</h1>
    <img id="cat" src="@/assets/cat.svg" alt="Cat">
    <button v-if="!$store.state.authenticated" @click="$store.dispatch('auth')">Login</button>
    <div v-if="$store.state.authenticated">
      <p>What is your cat's name?</p>
      <input type="text" v-model="name">
      <button @click="play()">Play</button>
    </div>
    <button v-if="$store.state.authenticated" @click="$store.dispatch('logout')">Logout</button>
  </div>
</template>

<style lang="scss" scoped>
.link {
  cursor: pointer
}

img#cat {
  max-width: 200px;
  margin-top: 30px;
}

button {
  margin-top: 20px;
  width: 173px;
  display: block;
}
</style>

<script>
export default {
  computed: {
    name: {
      get() {
        return this.$store.state.authenticated && this.$store.state.cat.name || ''
      },
      set(name) {
        this.$store.dispatch('updateCat', { ...this.$store.state.cat, name })
      }
    }
  },
  methods: {
    play() {
      this.$axios
        .post(process.env.VUE_APP_API + '/play')
        .then((response) => {
          this.$router.push({ name: 'Game', params: { id: response.data.generated_keys[0] }})
        })
    }
  },
  name: 'Home'
};
</script>
