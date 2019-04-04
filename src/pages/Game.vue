<template>
  <div v-if="game">
    <p>Connected: {{ isConnected }}</p>
    <p>Test: {{ game.test || false }}</p>
    <button v-if="joinable" @click="joinGame()">Join game</button>
    <ul v-if="game.cats">
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
      isConnected: false,
      game: null
    }
  },
  sockets: {
    connect() {
      this.isConnected = true;
    },

    disconnect() {
      this.isConnected = false;
    }
  },
  computed: {
    joinable() {
      if (!this.$store.state.authenticated || !this.game) { return false }

      let catIds = this.game.cats.map(c => { return c.id })

      return catIds.indexOf(this.$store.state.cat.id) === -1
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
    }
  },
  name: 'Game'
};
</script>
