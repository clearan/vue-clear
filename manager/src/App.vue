<template>
  <div id="app">
    <Mheader/>
    <SideBar/>
    <PageBoard/>
  </div>
</template>
<script>
import Mheader from '@/components/Header';
import SideBar from '@/components/SideBar';
import PageBoard from '@/components/PageBoard';

export default {
  components: {
    Mheader,
    SideBar,
    PageBoard
  },

}
</script>

<style lang="sass">

</style>
