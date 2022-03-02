<template>
<div class="page-board">
  <router-view></router-view>
</div>
</template>

<script>
export default {
  name: "PageBoard"
}
</script>

<style scoped lang="scss">
.page-board {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  padding: 90px 30px 30px 230px;
}
</style>
