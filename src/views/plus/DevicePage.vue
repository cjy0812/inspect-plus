<script setup lang="ts">
import SettingsModal from '@/components/SettingsModal.vue';
import DeviceControlTools from '@/components/DeviceControlTools.vue';
import DeviceSnapshotGroups from '@/components/plus/device/DeviceSnapshotGroups.vue';
import SvgIcon from '@/components/SvgIcon.vue';
import BaseDevicePage from '@/views/DevicePage.vue';

const settingsDlgShow = shallowRef(false);
const checkedRowKeys = shallowRef<number[]>([]);
</script>

<template>
  <BaseDevicePage>
    <template #server-actions="{ captureSnapshot, downloadAllSnapshot }">
      <NTooltip>
        <template #trigger>
          <NButton
            text
            style="--n-icon-size: var(--app-icon-size)"
            class="device-top-icon"
            :loading="captureSnapshot.loading"
            @click="captureSnapshot.invoke"
          >
            <SvgIcon name="Snapshot" />
          </NButton>
        </template>
        捕获快照
      </NTooltip>

      <DeviceControlTools />

      <NTooltip>
        <template #trigger>
          <NButton
            text
            style="--n-icon-size: var(--app-icon-size)"
            class="device-top-icon"
            :loading="downloadAllSnapshot.loading"
            @click="downloadAllSnapshot.invoke"
          >
            <SvgIcon name="Down-all" />
          </NButton>
        </template>
        下载所有快照
      </NTooltip>

      <template v-if="checkedRowKeys.length">
        <div h-full flex flex-items-center text-12px opacity-80>
          已选中 {{ checkedRowKeys.length }} 个快照
        </div>
      </template>

      <NTooltip>
        <template #trigger>
          <NButton
            text
            style="--n-icon-size: var(--app-icon-size)"
            class="device-top-icon"
            @click="settingsDlgShow = true"
          >
            <SvgIcon name="settings" />
          </NButton>
        </template>
        设置
      </NTooltip>
    </template>

    <template #content="{ snapshots, refreshSnapshots }">
      <DeviceSnapshotGroups
        v-model:checked-row-keys="checkedRowKeys"
        :snapshots="snapshots"
        :refresh-snapshots="refreshSnapshots"
      />
    </template>
  </BaseDevicePage>

  <SettingsModal v-model:show="settingsDlgShow" />
</template>
