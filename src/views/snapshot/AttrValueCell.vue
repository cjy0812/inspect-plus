<script setup lang="ts">
defineProps<{
  name: string;
  desc: string;
  isNull: boolean;
}>();
</script>

<template>
  <NEllipsis
    class="w-[calc(var(--gkd-w)*0.12)]"
    :class="{
      'text-left direction-rtl': name == 'id',
      'opacity-50': isNull,
    }"
  >
    {{ desc }}
  </NEllipsis>
</template>
