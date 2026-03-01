<script setup lang="ts">
const props = defineProps<{
  name: string;
  desc?: string | null;
  isNull: boolean;
}>();

const displayDesc = computed(() => {
  if (
    props.desc === null ||
    props.desc === undefined ||
    props.desc === 'undefined'
  ) {
    return '--';
  }
  return props.desc;
});
</script>

<template>
  <NEllipsis
    class="w-[calc(var(--gkd-w)*0.12)]"
    :class="{
      'text-left direction-rtl': name == 'id',
      'opacity-50': isNull,
    }"
  >
    {{ displayDesc }}
  </NEllipsis>
</template>
