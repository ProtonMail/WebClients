import './nativeComposerBridge';
import {
    onNativeClearCustomLumo,
    onNativeSelectCustomLumo,
    setNativeCustomLumos,
    setNativeSelectedCustomLumo,
    setNativeSidebarLayout,
} from './nativeComposerBridgeHelpers';

describe('nativeComposerBridgeHelpers - custom lumos', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('is a no-op when the bridge is unavailable', () => {
        const original = (window as any).nativeComposerApiInstance;
        delete (window as any).nativeComposerApiInstance;

        expect(() => setNativeCustomLumos([])).not.toThrow();
        expect(() => setNativeSelectedCustomLumo(null)).not.toThrow();

        (window as any).nativeComposerApiInstance = original;
    });

    it('forwards the list to the bridge instance when available', () => {
        const list = [{ id: 'a1', name: 'Writer', icon: 'robot', source: 'personal' as const }];
        const spy = jest.spyOn((window as any).nativeComposerApiInstance, 'setCustomLumos');

        setNativeCustomLumos(list);

        expect(spy).toHaveBeenCalledWith(list);
    });

    it('forwards the selected lumo to the bridge instance when available', () => {
        const spy = jest.spyOn((window as any).nativeComposerApiInstance, 'setSelectedCustomLumo');
        const lumo = { id: 'a1', name: 'Writer', icon: 'robot', source: 'personal' as const };

        setNativeSelectedCustomLumo(lumo);
        expect(spy).toHaveBeenCalledWith(lumo);

        setNativeSelectedCustomLumo(null);
        expect(spy).toHaveBeenCalledWith(null);
    });

    it('onNativeSelectCustomLumo subscribes and unsubscribes from lumo:selectCustomLumo', () => {
        const handler = jest.fn();
        const unsubscribe = onNativeSelectCustomLumo(handler);

        window.dispatchEvent(new CustomEvent('lumo:selectCustomLumo', { detail: { id: 'a1' } }));
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toEqual({ id: 'a1' });

        unsubscribe();
        window.dispatchEvent(new CustomEvent('lumo:selectCustomLumo', { detail: { id: 'a2' } }));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('onNativeClearCustomLumo subscribes and unsubscribes from lumo:clearCustomLumo', () => {
        const handler = jest.fn();
        const unsubscribe = onNativeClearCustomLumo(handler);

        window.dispatchEvent(new CustomEvent('lumo:clearCustomLumo'));
        expect(handler).toHaveBeenCalledTimes(1);

        unsubscribe();
        window.dispatchEvent(new CustomEvent('lumo:clearCustomLumo'));
        expect(handler).toHaveBeenCalledTimes(1);
    });
});

describe('nativeComposerBridgeHelpers - sidebar layout', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('forwards the layout to the bridge instance when available', () => {
        const spy = jest.spyOn((window as any).nativeComposerApiInstance, 'setSidebarLayout');

        setNativeSidebarLayout({ width: 300, animationDurationMs: 300 });
        expect(spy).toHaveBeenCalledWith({ width: 300, animationDurationMs: 300 });

        setNativeSidebarLayout(null);
        expect(spy).toHaveBeenCalledWith(null);
    });

    it('is a no-op when the bridge is unavailable', () => {
        const original = (window as any).nativeComposerApiInstance;
        delete (window as any).nativeComposerApiInstance;

        expect(() => setNativeSidebarLayout(null)).not.toThrow();

        (window as any).nativeComposerApiInstance = original;
    });
});
