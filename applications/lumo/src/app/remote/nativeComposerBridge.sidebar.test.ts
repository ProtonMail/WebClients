describe('nativeComposerBridge - sidebar layout', () => {
    let onStateChange: jest.Mock;
    let nativeComposerApiInstance: any;

    beforeEach(() => {
        jest.resetModules();
        onStateChange = jest.fn();
        (window as any).Android = { onStateChange };

        require('./nativeComposerBridge');
        nativeComposerApiInstance = (window as any).nativeComposerApiInstance;

        // The bridge pushes the initial state on import; ignore that for assertions below.
        onStateChange.mockClear();
    });

    afterEach(() => {
        delete (window as any).Android;
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
