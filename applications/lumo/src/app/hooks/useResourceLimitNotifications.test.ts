import type { ResourceLimitError } from '../redux/slices/meta/errors';
import { shouldShowResourceLimitError } from './resourceLimitNotificationHelpers';

const buildError = (overrides: Partial<ResourceLimitError>): ResourceLimitError => ({
    id: 'limit-error',
    resource: 'messages',
    limit: 250,
    timestamp: 1,
    ...overrides,
});

describe('shouldShowResourceLimitError', () => {
    it('shows message limit errors for the active conversation', () => {
        expect(
            shouldShowResourceLimitError(buildError({ conversationId: 'conversation-1' }), 'conversation-1', undefined)
        ).toBe(true);
    });

    it('hides message limit errors from another conversation', () => {
        expect(
            shouldShowResourceLimitError(buildError({ conversationId: 'conversation-1' }), 'conversation-2', undefined)
        ).toBe(false);
    });

    it('hides message limit errors from previous conversations on the new chat route', () => {
        expect(shouldShowResourceLimitError(buildError({ conversationId: 'conversation-1' }), undefined, undefined)).toBe(
            false
        );
    });

    it('shows asset limit errors for the active space', () => {
        expect(
            shouldShowResourceLimitError(
                buildError({ resource: 'assets', spaceId: 'space-1' }),
                'conversation-1',
                'space-1'
            )
        ).toBe(true);
    });

    it('hides asset limit errors from another space', () => {
        expect(
            shouldShowResourceLimitError(
                buildError({ resource: 'assets', spaceId: 'space-1' }),
                'conversation-2',
                'space-2'
            )
        ).toBe(false);
    });

    it('hides asset limit errors when no space is active', () => {
        expect(
            shouldShowResourceLimitError(buildError({ resource: 'assets', spaceId: 'space-1' }), undefined, undefined)
        ).toBe(false);
    });

    it('keeps legacy asset limit errors without space context global', () => {
        expect(shouldShowResourceLimitError(buildError({ resource: 'assets' }), undefined, undefined)).toBe(true);
    });

    it('shows conversation limit errors for the active conversation', () => {
        expect(
            shouldShowResourceLimitError(
                buildError({ resource: 'conversations', conversationId: 'conversation-1' }),
                'conversation-1',
                undefined
            )
        ).toBe(true);
    });

    it('hides conversation limit errors from another conversation', () => {
        expect(
            shouldShowResourceLimitError(
                buildError({ resource: 'conversations', conversationId: 'conversation-1' }),
                'conversation-2',
                undefined
            )
        ).toBe(false);
    });

    it('keeps legacy conversation limit errors without conversation context global', () => {
        expect(shouldShowResourceLimitError(buildError({ resource: 'conversations' }), undefined, undefined)).toBe(true);
    });

    it('shows legacy message limit errors without conversation context', () => {
        expect(shouldShowResourceLimitError(buildError({}), undefined, undefined)).toBe(true);
    });

    it('keeps space limit errors global', () => {
        expect(shouldShowResourceLimitError(buildError({ resource: 'spaces' }), undefined, undefined)).toBe(true);
    });
});
