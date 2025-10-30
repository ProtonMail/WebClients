import { LatestEventIdProvider } from './latestEventIdProvider';

describe('LatestEventIdProvider', () => {
    let provider: LatestEventIdProvider;

    beforeEach(() => {
        provider = new LatestEventIdProvider();
    });

    describe('getLatestEventId', () => {
        it('should return null for non-existent scope', () => {
            expect(provider.getLatestEventId('non-existent')).toBeNull();
        });

        it('should return saved event ID', () => {
            provider.saveLatestEventId('scope-1', 'event-1');

            expect(provider.getLatestEventId('scope-1')).toBe('event-1');
        });

        it('should return null after removing scope', () => {
            provider.saveLatestEventId('scope-1', 'event-1');
            provider.removeEventScope('scope-1');

            expect(provider.getLatestEventId('scope-1')).toBeNull();
        });
    });

    describe('saveLatestEventId', () => {
        it('should save event ID for new scope', () => {
            provider.saveLatestEventId('scope-1', 'event-1');

            expect(provider.getLatestEventId('scope-1')).toBe('event-1');
        });

        it('should update existing event ID', () => {
            provider.saveLatestEventId('scope-1', 'event-1');
            provider.saveLatestEventId('scope-1', 'event-2');

            expect(provider.getLatestEventId('scope-1')).toBe('event-2');
        });

        it('should handle multiple scopes independently', () => {
            provider.saveLatestEventId('scope-1', 'event-1');
            provider.saveLatestEventId('scope-2', 'event-2');

            expect(provider.getLatestEventId('scope-1')).toBe('event-1');
            expect(provider.getLatestEventId('scope-2')).toBe('event-2');
        });
    });

    describe('removeEventScope', () => {
        it('should remove existing scope', () => {
            provider.saveLatestEventId('scope-1', 'event-1');
            provider.removeEventScope('scope-1');

            expect(provider.getLatestEventId('scope-1')).toBeNull();
        });

        it('should handle removing non-existent scope gracefully', () => {
            expect(() => provider.removeEventScope('non-existent')).not.toThrow();
        });

        it('should not affect other scopes', () => {
            provider.saveLatestEventId('scope-1', 'event-1');
            provider.saveLatestEventId('scope-2', 'event-2');
            provider.removeEventScope('scope-1');

            expect(provider.getLatestEventId('scope-1')).toBeNull();
            expect(provider.getLatestEventId('scope-2')).toBe('event-2');
        });
    });
});
