<template>
<div>
  <div v-show="false">优化图片首次渲染</div>
  <div class="img-wrap">
    <div v-for="item in images" :key="item.id" class="img-section">
      <img :src="item.src" alt="" class="img-section-img">
    </div>
  </div>
</div>
</template>

<script>
import {getImages} from "../services";

export default {
  name: "Forage",
  data() {
    return {
      images: [],
    }
  },
  async mounted() {
    const res = await getImages();
    this.images = res
    // localforage.setItem('')
    console.log('images', this.images)
  }
}
</script>

<style scoped lang="scss">
.img-wrap {
  width: 500px;
  height: 700px;
  overflow: auto;
  .img-section {
    width: 500px;
    height: 250px;
    margin-bottom: 5px;
    overflow: hidden;
    &-img {
      width: 100%;
    }
  }
}
</style>
