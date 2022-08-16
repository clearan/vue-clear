<template>
  <div class="home">
    <h1>首页</h1>
  </div>
</template>

<script>

export default {
  name: 'Home',
  components: {
  },
  mounted() {
    document.addEventListener('visibilitychange', function() {
      console.log(document.visibilityState)
      if (document.visibilityState === 'hidden') {
        navigator.sendBeacon('http://localhost:3000/log', '1');
      }
    });
  }
}
</script>
