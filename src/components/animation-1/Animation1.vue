<template>
  <div id="sketch"></div>
</template>

<style scoped>
  #sketch {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;

    background-color: rgb(238, 225, 210);

    overflow: hidden;
  }
</style>

<script>
import p5 from "p5";
import sketch from './sketch.js'

export default {
  name: "animation-1",
  data() {
    return {
      p5: null
    } 
  },
  mounted() {
    this.p5 = new p5(sketch, document.getElementById('sketch'))
  }
};
</script>
