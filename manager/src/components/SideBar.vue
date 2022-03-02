<template>
<div class="side-bar">
  <ul>
    <li>
      <router-link to="/">首页</router-link>
    </li>
  </ul>
  <template v-for="(item, index) in $store.state.userRouters">
    <MenuItem :key="index" :item="item"></MenuItem>
  </template>
</div>
</template>

<script>
import MenuItem from "./MenuItem";
export default {
  name: "SideBar",
  components: {
    MenuItem
  }
}
</script>

<style scoped lang="scss">
.side-bar {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1;
  width: 200px;
  height: 100%;
  padding-top: 90px;
  background-color: #ccc;
}
</style>
