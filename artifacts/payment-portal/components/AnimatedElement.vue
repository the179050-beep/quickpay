<script setup lang="ts">
const props = defineProps<{ delay?: number }>()

const visible = ref(false)
onMounted(() => {
  setTimeout(() => { visible.value = true }, props.delay ?? 0)
})
</script>

<template>
  <Transition name="fade-up">
    <div v-show="visible" style="display:block">
      <slot />
    </div>
  </Transition>
</template>

<style scoped>
.fade-up-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
