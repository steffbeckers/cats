<template>
  
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
