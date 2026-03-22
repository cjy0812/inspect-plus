import localforage from 'localforage';

const storage = localforage.createInstance({
  name: 'plusScreenshotBackup',
  version: 1,
  driver: localforage.INDEXEDDB,
});

export const screenshotBackupStorage = {
  getItem(key: string | number) {
    return storage.getItem<ArrayBuffer>(key.toString());
  },
  setItem(key: string | number, value: ArrayBuffer) {
    return storage.setItem(key.toString(), value);
  },
  removeItem(key: string | number) {
    return storage.removeItem(key.toString());
  },
  hasItem(key: string | number) {
    const id = key.toString();
    return storage.keys().then((keys) => keys.includes(id));
  },
};
