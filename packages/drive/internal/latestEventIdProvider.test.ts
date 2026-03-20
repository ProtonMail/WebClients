import { LatestEventIdProvider } from './latestEventIdProvider';

describe('LatestEventIdProvider', () => {
    let provider: LatestEventIdProvider;

    beforeEach(() => {
        provider = new LatestEventIdProvider();
    });

    describe('getLatestEventId', () => {
        it('should return null for non-existent scope', async () => {
            expect(await provider.getLatestEventId('non-existent')).toBeNull();
        });

        it('should return saved event ID', async () => {
            await provider.saveLatestEventId('scope-1', 'event-1');

            expect(await provider.getLatestEventId('scope-1')).toBe('event-1');
        });

        it('should return null after removing scope', async () => {
            await provider.saveLatestEventId('scope-1', 'event-1');
            await provider.removeEventScope('scope-1');

            expect(await provider.getLatestEventId('scope-1')).toBeNull();
        });
    });

    describe('saveLatestEventId', () => {
        it('should save event ID for new scope', async () => {
            await provider.saveLatestEventId('scope-1', 'event-1');

            expect(await provider.getLatestEventId('scope-1')).toBe('event-1');
        });

        it('should update existing event ID', async () => {
            await provider.saveLatestEventId('scope-1', 'event-1');
            await provider.saveLatestEventId('scope-1', 'event-2');

            expect(await provider.getLatestEventId('scope-1')).toBe('event-2');
        });

        it('should handle multiple scopes independently', async () => {
            await provider.saveLatestEventId('scope-1', 'event-1');
            await provider.saveLatestEventId('scope-2', 'event-2');

            expect(await provider.getLatestEventId('scope-1')).toBe('event-1');
            expect(await provider.getLatestEventId('scope-2')).toBe('event-2');
        });
    });

    describe('removeEventScope', () => {
        it('should remove existing scope', async () => {
            await provider.saveLatestEventId('scope-1', 'event-1');
            await provider.removeEventScope('scope-1');

            expect(await provider.getLatestEventId('scope-1')).toBeNull();
        });

        it('should handle removing non-existent scope gracefully', async () => {
            await expect(provider.removeEventScope('non-existent')).resolves.not.toThrow();
        });

        it('should not affect other scopes', async () => {
            await provider.saveLatestEventId('scope-1', 'event-1');
            await provider.saveLatestEventId('scope-2', 'event-2');
            await provider.removeEventScope('scope-1');

            expect(await provider.getLatestEventId('scope-1')).toBeNull();
            expect(await provider.getLatestEventId('scope-2')).toBe('event-2');
        });
    });
});
