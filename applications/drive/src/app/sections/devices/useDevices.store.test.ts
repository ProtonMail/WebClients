import type { Device } from '@proton/drive';

import { useDevicesStore } from './useDevices.store';

jest.mock('../../utils/sdk/getNodeName', () => ({
    getDeviceName: (device: Device) => device.name as unknown as string,
}));

const makeDevice = (uid: string, name: string): Device =>
    ({ uid, name, rootFolderUid: `root-${uid}`, shareId: `share-${uid}` }) as unknown as Device;

describe('useDevicesStore', () => {
    beforeEach(() => {
        useDevicesStore.setState({ items: new Map(), sortedItemUids: [], isLoading: false, hasEverLoaded: false });
    });

    it('adds a device and sorts by name', () => {
        useDevicesStore.getState().setItem(makeDevice('2', 'Zeta'));
        useDevicesStore.getState().setItem(makeDevice('1', 'Alpha'));
        useDevicesStore.getState().setItem(makeDevice('3', 'Mango'));

        // Alpha < Mango < Zeta
        expect(useDevicesStore.getState().sortedItemUids).toEqual(['1', '3', '2']);
    });

    it('re-sorts after rename', () => {
        useDevicesStore.getState().setItem(makeDevice('1', 'Alpha'));
        useDevicesStore.getState().setItem(makeDevice('2', 'Zeta'));

        useDevicesStore.getState().renameDevice('1', 'Omega');

        // Omega < Zeta → ['1', '2']
        expect(useDevicesStore.getState().sortedItemUids).toEqual(['1', '2']);
    });

    it('removes a device', () => {
        useDevicesStore.getState().setItem(makeDevice('1', 'Alpha'));
        useDevicesStore.getState().setItem(makeDevice('2', 'Beta'));

        useDevicesStore.getState().removeItem('1');

        expect(useDevicesStore.getState().sortedItemUids).toEqual(['2']);
        expect(useDevicesStore.getState().items.has('1')).toBe(false);
    });

    it('tracks loading state and hasEverLoaded', () => {
        useDevicesStore.getState().setLoading(true);
        expect(useDevicesStore.getState().isLoading).toBe(true);
        expect(useDevicesStore.getState().hasEverLoaded).toBe(false); // never unloaded yet

        useDevicesStore.getState().setLoading(false);
        expect(useDevicesStore.getState().isLoading).toBe(false);
        expect(useDevicesStore.getState().hasEverLoaded).toBe(true);
    });

    it('clears all items', () => {
        useDevicesStore.getState().setItem(makeDevice('1', 'Alpha'));
        useDevicesStore.getState().clearAll();

        expect(useDevicesStore.getState().items.size).toBe(0);
        expect(useDevicesStore.getState().sortedItemUids).toEqual([]);
    });
});
