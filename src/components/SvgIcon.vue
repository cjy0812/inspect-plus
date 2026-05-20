<script lang="ts">
const svgElMap = computedAsync(
  async () => (await import('@/utils/svg')).default,
  {},
);
</script>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string;
    strokeWidth?: string;
  }>(),
  {},
);

const svgEl = computed(() => svgElMap.value[props.name]);
const actualEl = shallowRef<SVGSVGElement>();
watchEffect(() => {
  const s = svgEl.value;
  const a = actualEl.value;
  if (!s || !a) return;
  a.replaceChildren(...s.cloneNode(true).childNodes);
});
</script>
<template>
  <svg
    v-if="svgEl"
    ref="actualEl"
    class="SvgIcon"
    :name="name"
    :viewBox="svgEl.getAttribute('viewBox') ?? undefined"
    :fill="svgEl.getAttribute('fill') ?? undefined"
    :style="{ '--svg-stroke-width': strokeWidth }"
  ></svg>
</template>
<style>
.SvgIcon {
  display: block;
  overflow: hidden;
  height: var(--svg-h, var(--n-icon-size, var(--app-icon-size, 1em)));
  width: var(--svg-w, var(--n-icon-size, var(--app-icon-size, 1em)));
  stroke-width: var(--svg-stroke-width);
}
.SvgIcon:not([fill]) {
  fill: currentColor;
}
</style>
