import { PASS_COMMANDS, resolveShortcuts } from './commands';

describe('resolveShortcuts', () => {
    const supported = {
        [PASS_COMMANDS.EXECUTE_ACTION]: 'Open the popup',
        [PASS_COMMANDS.LARGER_WINDOW]: 'Open in a larger window',
        [PASS_COMMANDS.AUTOFILL]: 'Autofill a login',
    };

    test('should map supported commands to their description', () => {
        expect(resolveShortcuts([{ name: PASS_COMMANDS.LARGER_WINDOW, shortcut: 'Ctrl+Shift+L' }], supported)).toEqual([
            { name: PASS_COMMANDS.LARGER_WINDOW, shortcut: 'Ctrl+Shift+L', description: 'Open in a larger window' },
        ]);
    });

    test('should resolve the autofill command', () => {
        expect(resolveShortcuts([{ name: PASS_COMMANDS.AUTOFILL, shortcut: 'Ctrl+Shift+F' }], supported)).toEqual([
            { name: PASS_COMMANDS.AUTOFILL, shortcut: 'Ctrl+Shift+F', description: 'Autofill a login' },
        ]);
    });

    test('should filter out unsupported commands', () => {
        expect(resolveShortcuts([{ name: 'unknown-command', shortcut: 'Ctrl+Shift+K' }], supported)).toEqual([]);
    });

    test('should filter out commands without a name', () => {
        expect(resolveShortcuts([{ shortcut: 'Ctrl+Shift+K' }], supported)).toEqual([]);
    });

    test('should default an unconfigured shortcut to an empty string', () => {
        expect(resolveShortcuts([{ name: PASS_COMMANDS.AUTOFILL }], supported)).toEqual([
            { name: PASS_COMMANDS.AUTOFILL, shortcut: '', description: 'Autofill a login' },
        ]);
    });

    test('should preserve the order returned by the browser', () => {
        const commands = [
            { name: PASS_COMMANDS.AUTOFILL, shortcut: 'Ctrl+Shift+F' },
            { name: 'unknown-command', shortcut: 'Ctrl+Shift+K' },
            { name: PASS_COMMANDS.EXECUTE_ACTION, shortcut: 'Ctrl+Shift+X' },
        ];

        expect(resolveShortcuts(commands, supported).map(({ name }) => name)).toEqual([
            PASS_COMMANDS.AUTOFILL,
            PASS_COMMANDS.EXECUTE_ACTION,
        ]);
    });
});
