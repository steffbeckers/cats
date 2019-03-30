<template>
  <img id="cat" src="@/assets/cat.svg" alt="Cat">
</template>

<style lang="scss" scoped>
img#cat {
  max-width: 200px;
}
</style>

<script>
export default {
  data() {
    return {
      name: ''
    }
  },
  name: 'Cat'
};
</script>
