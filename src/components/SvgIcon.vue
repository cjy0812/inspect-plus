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
  }>(),
  {},
);

const svgEl = computed(() => svgElMap.value[props.name]);
const actualEl = shallowRef<SVGSVGElement>();
watchEffect(() => {
  const s = svgEl.value;
  const a = actualEl.value;
  if (!s || !a) return;
  a.replaceChildren(...Array.from(s.cloneNode(true).childNodes));
});
</script>
<template>
  <svg
    v-if="svgEl"
    ref="actualEl"
    class="SvgIcon"
    :name="name"
    :viewBox="svgEl.getAttributeNS(null, 'viewBox') || undefined"
  ></svg>
</template>
<style>
.SvgIcon {
  display: block;
  overflow: hidden;
  height: var(--svg-h, var(--n-icon-size, var(--app-icon-size, 1em)));
  width: var(--svg-w, var(--n-icon-size, var(--app-icon-size, 1em)));
  fill: currentColor;
  stroke: currentColor;
}
.SvgIcon * {
  fill: currentColor;
  stroke: currentColor;
}
</style>
