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
            shouldShowResourceLimitError(buildError({ conversationId: 'conversation-1' }), 'conversation-1')
        ).toBe(true);
    });

    it('hides message limit errors from another conversation', () => {
        expect(
            shouldShowResourceLimitError(buildError({ conversationId: 'conversation-1' }), 'conversation-2')
        ).toBe(false);
    });

    it('hides message limit errors from previous conversations on the new chat route', () => {
        expect(shouldShowResourceLimitError(buildError({ conversationId: 'conversation-1' }), undefined)).toBe(false);
    });

    it('keeps non-message resource errors global', () => {
        expect(shouldShowResourceLimitError(buildError({ resource: 'assets', spaceId: 'space-1' }), undefined)).toBe(
            true
        );
    });

    it('shows conversation limit errors for the active conversation', () => {
        expect(
            shouldShowResourceLimitError(
                buildError({ resource: 'conversations', conversationId: 'conversation-1' }),
                'conversation-1'
            )
        ).toBe(true);
    });

    it('hides conversation limit errors from another conversation', () => {
        expect(
            shouldShowResourceLimitError(
                buildError({ resource: 'conversations', conversationId: 'conversation-1' }),
                'conversation-2'
            )
        ).toBe(false);
    });

    it('keeps legacy conversation limit errors without conversation context global', () => {
        expect(shouldShowResourceLimitError(buildError({ resource: 'conversations' }), undefined)).toBe(true);
    });

    it('shows legacy message limit errors without conversation context', () => {
        expect(shouldShowResourceLimitError(buildError({}), undefined)).toBe(true);
    });
});
