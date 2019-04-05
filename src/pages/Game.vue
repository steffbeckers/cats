<template>
  <div v-if="game">
    <p>Connected: {{ $store.state.connected }}</p>
    <p>Test: {{ game.test || false }}</p>
    <button v-if="joinable" @click="joinGame()">Join game</button>
    <ul v-if="game.cats">
      <li v-for="cat in cats" :key="cat.id" :style="{ fontWeight: cat.id === $store.state.cat.id ? 'bold' : 'normal'}">
        {{ cat.name }}: {{ cat.score || 0 }} points
      </li>
    </ul>
    <button @click="score()">Score point</button>    
  </div>
</template>

<script>
export default {
  data() {
    return {
      game: null
    }
  },
  computed: {
    joinable() {
      if (!this.$store.state.authenticated || !this.game) { return false }

      let catIds = this.game.cats.map(c => { return c.id })

      return catIds.indexOf(this.$store.state.cat.id) === -1
    },
    cats() {
      if (!this.game || !this.game.cats) { return [] }

      let cats = [...this.game.cats]

      function compare(a, b) {
        if (a.score < b.score)
          return 1;
        if (a.score > b.score)
          return -1;
        return 0;
      }

      return cats.sort(compare);
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

          // Realtime updates
          this.sockets.subscribe('game-' + this.game.id, (update) => {
            this.game = update
          });
        })
    },
    joinGame() {
      this.$axios
        .post(process.env.VUE_APP_API + '/game/' + this.game.id + '/join')
        .then((response) => {
          this.game = response.data
        })
    },
    score() {
      this.$axios
        .post(process.env.VUE_APP_API + '/game/' + this.game.id + '/score')
        .then((response) => {
          this.game = response.data
        })
    }
  },
  name: 'Game'
};
</script>
