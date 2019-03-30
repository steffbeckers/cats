<template>
  <div>
    <h1>Let's play cat and mouse!</h1>
    <!-- <p class="link" v-if="$store.state.cat && !$store.state.cat.name" @click="$router.push({ path: '/' + $store.state.cat.id })">What is your cat's name?</p> -->
    <img id="cat" src="@/assets/cat.svg" alt="Cat">
    <p>What is your cat's name?</p>
    <input type="text" v-model="cat.name">
    <button @click="play()">Play</button>
  </div>
</template>

<style lang="scss" scoped>
.link {
  cursor: pointer
}

img#cat {
  max-width: 200px;
}

button {
  margin-top: 20px;
  width: 173px;
  display: block;
}
</style>

<script>
export default {
  data() {
    return {
      cat: this.$store.state.cat || {}
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
  watch: {
    cat: {
      handler: function(newCat) {
        this.$store.dispatch('updateCat', newCat)
      },
      deep: true
    }
  },
  name: 'Home'
};
</script>
