import type { Mock } from 'vitest';
describe('nativeComposerBridge - sidebar layout', () => {
    let onStateChange: Mock;
    let nativeComposerApiInstance: any;

    beforeEach(async () => {
        vi.resetModules();
        onStateChange = vi.fn();
        (window as any).Android = { onStateChange };

        await import('./nativeComposerBridge');
        nativeComposerApiInstance = (window as any).nativeComposerApiInstance;

        // The bridge pushes the initial state on import; ignore that for assertions below.
        onStateChange.mockClear();
    });

    afterEach(() => {
        delete (window as any).Android;
    });

    it('pushes measured right-panel space to native', () => {
        nativeComposerApiInstance.setRightPanelWidth(420);

        expect(onStateChange).toHaveBeenCalledWith(expect.stringContaining('"rightPanelWidth":420'));
    });

    it('leaves optional right geometry absent until a supporting client reports it', () => {
        expect(nativeComposerApiInstance.getState()).not.toHaveProperty('rightPanelWidth');
    });

    it('defaults to no sidebar layout', () => {
        expect(nativeComposerApiInstance.getState()).toMatchObject({ sidebar: null });
    });

    it('setSidebarLayout updates state and pushes it to native', () => {
        nativeComposerApiInstance.setSidebarLayout({ width: 300, animationDurationMs: 300 });

        expect(nativeComposerApiInstance.getState().sidebar).toEqual({ width: 300, animationDurationMs: 300 });
        expect(onStateChange).toHaveBeenCalledTimes(1);
        expect(JSON.parse(onStateChange.mock.calls[0][0]).sidebar).toEqual({
            width: 300,
            animationDurationMs: 300,
        });
    });

    it('setSidebarLayout pushes null when the sidebar stops being applicable', () => {
        nativeComposerApiInstance.setSidebarLayout({ width: 300, animationDurationMs: 0 });
        onStateChange.mockClear();

        nativeComposerApiInstance.setSidebarLayout(null);

        expect(nativeComposerApiInstance.getState().sidebar).toBeNull();
        expect(JSON.parse(onStateChange.mock.calls[0][0]).sidebar).toBeNull();
    });

    it('setSidebarLayout does not push again when the layout is unchanged', () => {
        nativeComposerApiInstance.setSidebarLayout({ width: 300, animationDurationMs: 300 });
        onStateChange.mockClear();

        nativeComposerApiInstance.setSidebarLayout({ width: 300, animationDurationMs: 300 });

        expect(onStateChange).not.toHaveBeenCalled();
    });
});
