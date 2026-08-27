describe('nativeComposerBridge - custom lumos', () => {
    let onStateChange: jest.Mock;
    let nativeComposerApiInstance: any;
    let nativeComposerApi: any;

    beforeEach(() => {
        jest.resetModules();
        onStateChange = jest.fn();
        (window as any).Android = { onStateChange };

        require('./nativeComposerBridge');
        nativeComposerApiInstance = (window as any).nativeComposerApiInstance;
        nativeComposerApi = (window as any).nativeComposerApi;

        // The bridge pushes the initial state on import; ignore that for assertions below.
        onStateChange.mockClear();
    });

    afterEach(() => {
        delete (window as any).Android;
    });

    it('defaults to an empty list and no selection', () => {
        expect(nativeComposerApiInstance.getState()).toMatchObject({
            customLumos: [],
            selectedCustomLumo: null,
        });
    });

    it('pushes the Apertus model feature flag to native', () => {
        nativeComposerApiInstance.toggleApertusModelEnabled(true);

        expect(nativeComposerApiInstance.getState().featureFlags.isApertusModelEnabled).toBe(true);
        expect(JSON.parse(onStateChange.mock.lastCall[0]).featureFlags.isApertusModelEnabled).toBe(true);
    });

    it('setCustomLumos updates state and pushes it to native', () => {
        const list = [{ id: 'a1', name: 'Writer', source: 'personal' }];

        nativeComposerApiInstance.setCustomLumos(list);

        expect(nativeComposerApiInstance.getState().customLumos).toEqual(list);
        expect(onStateChange).toHaveBeenCalledTimes(1);
        expect(JSON.parse(onStateChange.mock.calls[0][0]).customLumos).toEqual(list);
    });

    it('setCustomLumos does not push again when the list is unchanged', () => {
        const list = [{ id: 'a1', name: 'Writer', source: 'personal' }];

        nativeComposerApiInstance.setCustomLumos(list);
        onStateChange.mockClear();
        nativeComposerApiInstance.setCustomLumos([{ ...list[0] }]);

        expect(onStateChange).not.toHaveBeenCalled();
    });

    it('setSelectedCustomLumo updates state and pushes it to native', () => {
        const lumo = { id: 'a1', name: 'Writer', source: 'personal' };
        nativeComposerApiInstance.setSelectedCustomLumo(lumo);

        expect(nativeComposerApiInstance.getState().selectedCustomLumo).toEqual(lumo);
        expect(onStateChange).toHaveBeenCalledTimes(1);

        onStateChange.mockClear();
        nativeComposerApiInstance.setSelectedCustomLumo(null);

        expect(nativeComposerApiInstance.getState().selectedCustomLumo).toBeNull();
        expect(onStateChange).toHaveBeenCalledTimes(1);
    });

    it('selectCustomLumo dispatches a lumo:selectCustomLumo event with the id', async () => {
        const handler = jest.fn();
        window.addEventListener('lumo:selectCustomLumo', handler);

        const result = await nativeComposerApiInstance.selectCustomLumo('a1');

        expect(result).toEqual({ success: true });
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toEqual({ id: 'a1' });

        window.removeEventListener('lumo:selectCustomLumo', handler);
    });

    it('clearCustomLumo dispatches a lumo:clearCustomLumo event', async () => {
        const handler = jest.fn();
        window.addEventListener('lumo:clearCustomLumo', handler);

        const result = await nativeComposerApiInstance.clearCustomLumo();

        expect(result).toEqual({ success: true });
        expect(handler).toHaveBeenCalledTimes(1);

        window.removeEventListener('lumo:clearCustomLumo', handler);
    });

    it('exposes selectCustomLumo and clearCustomLumo as native-callable commands', () => {
        expect(typeof nativeComposerApi.selectCustomLumo).toBe('function');
        expect(typeof nativeComposerApi.clearCustomLumo).toBe('function');
    });

    it('does not expose setCustomLumos/setSelectedCustomLumo to native, since those must only ever be pushed by web', () => {
        // Native must go through selectCustomLumo/clearCustomLumo (which round-trip via
        // Redux) rather than writing customLumos/selectedCustomLumo directly, or its
        // write would be silently clobbered by the next real state push.
        expect(nativeComposerApi.setCustomLumos).toBeUndefined();
        expect(nativeComposerApi.setSelectedCustomLumo).toBeUndefined();
    });
});
