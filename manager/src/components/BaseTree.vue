<template>
  <ul class="tree">
    <li
        v-for="(node, index) in data"
        :key="node[defaultProps.label]"
        class="tree-node"
    >
      <i
          v-if="node[defaultProps.children]"
          class="iconfont"
          :class="{
          'icon-down': !showChildren[index],
          'icon-right': showChildren[index],
        }"
      />
      <span
          class="node-label"
          @click="handleClick(index)"
      >{{ node[defaultProps.label] }}</span>
      <keep-alive>
        <base-tree
            v-if="showChildren[index] && node[defaultProps.children]"
            :data="node[defaultProps.children]"
        />
      </keep-alive>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'base-tree',
  props: {
    data: {
      type: Array,
      required: true,
    },
    defaultProps: {
      type: Object,
      default: () => ({
        label: 'label',
        children: 'children',
      })
    },
  },
  data () {
    return {
      showChildren: [],
    }
  },
  methods: {
    handleClick (index) {
      const flag = !this.showChildren[index];
      this.$set(this.showChildren, index, flag);
    },
  },
  deactivated() {
    // 加上了keepalive之后，隐藏子集就不会销毁子组件，每次隐藏会触发deactivated钩子函数
    console.log('deactivated')
  },
  destroyed() {
    // 没有keepalive，每次隐藏子集，就会销毁子组件，性能很低
    console.log('destroyed')
  }
}
</script>

<style scoped>

li {
  list-style: none;
}

.tree-node {
  cursor: pointer;
}

.tree-node .iconfont {
  color: #c0c4cc;
  font-size: 12px;
  margin-right: 5px;
  vertical-align: middle;
}

.tree-node .node-label {
  font-size: 14px;
  color: #606266;
  vertical-align: middle;
}
</style>
