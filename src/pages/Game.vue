<template>
  <div>
    <h1>Cats</h1>
    <ul>
      <li v-for="cat in game.cats" :key="cat.id">
        {{ cat.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      game: {}
    }
  },
  mounted() {
    this.loadGame()
  },
  methods: {
    loadGame() {
      this.$axios
        .get(process.env.VUE_APP_API + '/game/' + this.$route.params.id)
        .then((response) => {
          this.game = response.data
        })
    }
  },
  name: 'Game'
};
</script>
