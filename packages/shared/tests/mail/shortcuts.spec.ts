import { KeyboardKey } from '../../lib/interfaces';
import { isValidShortcut } from '../../lib/shortcuts/helpers';

describe('isValidShortcut - Validate keyboard shortcut', () => {
    const aKey = {
        key: KeyboardKey.A,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
    } as KeyboardEvent;
    const aKeyWithShift = {
        key: KeyboardKey.A,
        metaKey: false,
        ctrlKey: false,
        shiftKey: true,
    } as KeyboardEvent;
    const aKeyWithMeta = {
        key: KeyboardKey.A,
        metaKey: true,
        ctrlKey: true,
        shiftKey: false,
    } as KeyboardEvent;

    it('Should validate a single key shortcut', () => {
        expect(isValidShortcut([KeyboardKey.A], aKey)).toBe(true);
        expect(isValidShortcut([KeyboardKey.A], aKeyWithShift)).toBe(false);
        expect(isValidShortcut([KeyboardKey.A], aKeyWithMeta)).toBe(false);
    });

    it('Should validate combined keys shortcut', () => {
        expect(isValidShortcut([KeyboardKey.A, 'Shift'], aKeyWithShift)).toBe(true);
        expect(isValidShortcut([KeyboardKey.A, 'Shift'], aKeyWithMeta)).toBe(false);
        expect(isValidShortcut([KeyboardKey.A, 'Shift'], aKey)).toBe(false);
    });
});
