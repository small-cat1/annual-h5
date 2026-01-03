<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <keep-alive :include="keepAliveList">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const keepAliveList = computed(() => {
  return route.meta?.keepAlive ? [route.name] : []
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
