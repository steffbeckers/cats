<template>
  <div v-if="game">
    <aside>
      <button v-if="joinable" @click="joinGame()">Join game</button>
      <ul v-if="game.cats">
        <li v-for="cat in cats" :key="cat.id" :style="{ fontWeight: cat.id === $store.state.cat.id ? 'bold' : 'normal'}">
          {{ cat.name }}: {{ cat.score || 0 }} points
        </li>
      </ul>
    </aside>
    <section @click="score()">
      <animation-1></animation-1>
    </section>
  </div>
</template>

<style lang="scss">
  aside {
    position: fixed;
    top: 0;
    left: 0;

    color: #ffffff;
    padding: 20px;

    ul {
      list-style-type: none;
      padding: 0px;
      margin: 0px;
    }
  }

  section {
    width: 100vw;
    width: 100vh;
  }
</style>

<script>
import Animation1 from '../components/Animation1';

export default {
  components: {
    'animation-1': Animation1
  },
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
    joined() {
      return !this.joinable
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
      if (!this.joined) { return }

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
