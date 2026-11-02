import { registerBackgroundEffectDebug } from './backgroundEffectDebug';

describe('registerBackgroundEffectDebug', () => {
    const cleanups: (() => void)[] = [];

    afterEach(() => {
        window.meetBackgroundEffectDebug?.setView('composite');
        cleanups.splice(0).forEach((cleanup) => cleanup());
    });

    it('switches every registered effect and stops after unregistering', () => {
        const first = { setDebugView: vi.fn() };
        const second = { setDebugView: vi.fn() };
        cleanups.push(registerBackgroundEffectDebug(first));
        const unregisterSecond = registerBackgroundEffectDebug(second);

        window.meetBackgroundEffectDebug?.setView('mask');
        unregisterSecond();
        window.meetBackgroundEffectDebug?.setView('composite');

        expect(first.setDebugView.mock.calls).toEqual([['composite'], ['mask'], ['composite']]);
        expect(second.setDebugView.mock.calls).toEqual([['composite'], ['mask']]);
        expect(window.meetBackgroundEffectDebug?.view).toBe('composite');
    });

    it('puts an effect registered later in the current view', () => {
        cleanups.push(registerBackgroundEffectDebug({ setDebugView: vi.fn() }));
        window.meetBackgroundEffectDebug?.setView('mask');

        const later = { setDebugView: vi.fn() };
        cleanups.push(registerBackgroundEffectDebug(later));

        expect(later.setDebugView).toHaveBeenCalledWith('mask');
    });

    it('puts an effect that registers again back in the default view', () => {
        const target = { setDebugView: vi.fn() };
        const unregister = registerBackgroundEffectDebug(target);
        window.meetBackgroundEffectDebug?.setView('mask');
        unregister();
        window.meetBackgroundEffectDebug?.setView('composite');

        cleanups.push(registerBackgroundEffectDebug(target));

        expect(target.setDebugView).toHaveBeenLastCalledWith('composite');
    });
});
