<template>
  <div>
    <h1>Let's play cat and mouse!</h1>
    <p class="link" v-if="$store.state.cat && !$store.state.cat.name" @click="$router.push({ path: '/' + $store.state.cat.id })">What is your cat's name?</p>
  </div>
</template>

<style>
.link {
  cursor: pointer
}
</style>

<script>
export default {
  name: "Home"
};
</script>
