import { generateSyntheticLogCall, generateSyntheticLogCalls } from './fixtures';

describe('generateSyntheticLogCalls', () => {
    it('generates the requested number of calls', () => {
        expect(generateSyntheticLogCalls(25)).toHaveLength(25);
    });

    it('generates calls with a valid level, a message and at least one argument', () => {
        const calls = generateSyntheticLogCalls(100);

        calls.forEach(({ level, message, args }) => {
            expect(['trace', 'debug', 'info', 'warn', 'error']).toContain(level);
            expect(message.length).toBeGreaterThan(0);
            expect(args.length).toBeGreaterThan(0);
        });
    });

    it('occasionally generates a real Error argument, matching how the app logs failures', () => {
        const calls = Array.from({ length: 200 }, generateSyntheticLogCall);

        expect(calls.some(({ args }) => args.some((arg) => arg instanceof Error))).toBe(true);
    });
});
