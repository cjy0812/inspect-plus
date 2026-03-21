<script setup lang="ts">
import HomeSnapshotGroups from '@/components/plus/home/HomeSnapshotGroups.vue';
import BaseHomePage from '@/views/home/HomePage.vue';
</script>

<template>
  <BaseHomePage>
    <template
      #content="{
        checkedRowKeys,
        setCheckedRowKeys,
        filterSnapshots,
        loading,
        updateSnapshots,
      }"
    >
      <HomeSnapshotGroups
        :checked-row-keys="checkedRowKeys"
        :snapshots="filterSnapshots"
        :loading="loading"
        :update-snapshots="updateSnapshots"
        @update:checkedRowKeys="setCheckedRowKeys"
      />
    </template>
  </BaseHomePage>
</template>
