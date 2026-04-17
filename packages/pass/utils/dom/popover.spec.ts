import { wait } from '@proton/shared/lib/helpers/promise';

import { TopLayerManager, safeMatch, safeQuery } from './popover';

describe('TopLayerManager', () => {
    const toggleEl = async (el: HTMLElement, open: boolean) => {
        jest.spyOn(el, 'matches').mockImplementation((s: string) => open && (s === ':popover-open' || s === ':modal'));
        el.dispatchEvent(new Event('toggle'));
        await wait(0);
    };

    const createPopoverEl = () => {
        const el = document.createElement('div');
        el.setAttribute('popover', 'manual');
        document.body.appendChild(el);
        return el;
    };

    beforeEach(() => TopLayerManager.connect());

    afterEach(async () => {
        TopLayerManager.disarm();
        document.body.innerHTML = '';
        await wait(0);
        TopLayerManager.disconnect();
        jest.restoreAllMocks();
    });

    test('reflects current top-layer ordering', async () => {
        const guard = createPopoverEl();
        const overlay = createPopoverEl();
        /** 1. Guard is topmost → trusted */
        await toggleEl(guard, true);
        expect(TopLayerManager.ensureTopLevel(guard)).toBe(true);
        /** 2. Overlay enters above guard → untrusted */
        await toggleEl(overlay, true);
        expect(TopLayerManager.ensureTopLevel(guard)).toBe(false);
    });

    test('foreign element cycling above guard poisons within the window', async () => {
        const now = jest.spyOn(performance, 'now');
        let time = 1000;
        now.mockImplementation(() => time);
        /** 1. Open guarded popover */
        const guard = createPopoverEl();
        await toggleEl(guard, true);
        TopLayerManager.arm(guard);
        /** 2. Overlay enters then cycles out (timing attack) */
        const overlay = createPopoverEl();
        await toggleEl(overlay, true);
        await toggleEl(overlay, false);
        /** 3. Within poison window → still untrusted */
        expect(TopLayerManager.ensureTopLevel(guard)).toBe(false);
        /** 4. Past poison window → trusted again */
        time = 1151;
        expect(TopLayerManager.ensureTopLevel(guard)).toBe(true);
    });

    test("guard's own toggle does not poison", async () => {
        const guard = createPopoverEl();
        /** 1. Arm before guard's toggle fires (fires before it's in the set) */
        TopLayerManager.arm(guard);
        await toggleEl(guard, true);
        /** 2. No self-contamination → trusted */
        expect(TopLayerManager.ensureTopLevel(guard)).toBe(true);
    });

    test('`arm` resets prior contamination', async () => {
        jest.spyOn(performance, 'now').mockImplementation(() => 1000);
        /** 1. Poison the guard */
        const guard = createPopoverEl();
        await toggleEl(guard, true);
        TopLayerManager.arm(guard);
        const overlay = createPopoverEl();
        await toggleEl(overlay, true);
        await toggleEl(overlay, false);
        /** 2. Re-arm clears poisonedAt → trusted */
        TopLayerManager.arm(guard);
        expect(TopLayerManager.ensureTopLevel(guard)).toBe(true);
    });

    test('`disarm` stops foreign elements from poisoning', async () => {
        jest.spyOn(performance, 'now').mockImplementation(() => 1000);
        /** 1. Arm then immediately disarm */
        const guard = createPopoverEl();
        await toggleEl(guard, true);
        TopLayerManager.arm(guard);
        TopLayerManager.disarm();
        /** 2. Overlay cycles — no guard set, no poisoning → trusted */
        const overlay = createPopoverEl();
        await toggleEl(overlay, true);
        await toggleEl(overlay, false);
        expect(TopLayerManager.ensureTopLevel(guard)).toBe(true);
    });
});

describe('`safeMatch`', () => {
    let el: HTMLElement;

    beforeEach(() => {
        el = document.createElement('div');
        el.className = 'test-class';
    });

    test('should return `true` when element matches selector', () => {
        const result = safeMatch(el, '.test-class');
        expect(result).toBe(true);
    });

    test('should return `false` when element does not match selector', () => {
        const result = safeMatch(el, '.other-class');
        expect(result).toBe(false);
    });

    test('should return `false` when `matches()` throws [Firefox ESR 115 regression]', () => {
        jest.spyOn(el, 'matches').mockImplementation(() => {
            throw new Error();
        });

        const result = safeMatch(el, '.test-class');
        expect(result).toBe(false);
    });
});

describe('`safeQuery`', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="test-item"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should return array of matching elements', () => {
        const result = safeQuery('.test-item');
        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(HTMLElement);
    });

    test('should return empty array when no elements match', () => {
        const result = safeQuery('.non-existent');
        expect(result).toEqual([]);
    });

    test('should return empty array when querySelectorAll throws', () => {
        jest.spyOn(document, 'querySelectorAll').mockImplementation(() => {
            throw new Error();
        });

        const result = safeQuery('.test-item');
        expect(result).toEqual([]);
    });
});
