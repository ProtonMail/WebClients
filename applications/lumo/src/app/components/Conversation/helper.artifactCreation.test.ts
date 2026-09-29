import { clearPendingArtifactCreation } from '../../redux/slices/composerActions';
import { addConversation } from '../../redux/slices/core/conversations';
import type { LumoState } from '../../redux/store';
import { cleanConversation, getConversationPriv } from '../../types';
import type { Conversation } from '../../types';
import { initializeNewSpaceAndConversation, resolveArtifactCreationEnabled } from './helper';

interface StateOptions {
    globalDefault?: boolean;
    pending?: boolean | null;
    override?: boolean;
}

function makeState({ globalDefault, pending = null, override }: StateOptions): LumoState {
    return {
        lumoUserSettings: { automaticArtifactCreation: globalDefault },
        composerActions: { pendingArtifactCreation: pending },
        conversations: {
            'conv-1': { id: 'conv-1', title: 'Chat', ...(override !== undefined && { artifactCreation: override }) },
        },
    } as unknown as LumoState;
}

describe('resolveArtifactCreationEnabled', () => {
    it('defaults to on when nothing is set', () => {
        expect(resolveArtifactCreationEnabled(makeState({}), 'conv-1')).toBe(true);
    });

    it('follows the global setting when the conversation has no override', () => {
        expect(resolveArtifactCreationEnabled(makeState({ globalDefault: false }), 'conv-1')).toBe(false);
    });

    it('prefers the conversation override over the global setting', () => {
        expect(resolveArtifactCreationEnabled(makeState({ globalDefault: true, override: false }), 'conv-1')).toBe(
            false
        );
        expect(resolveArtifactCreationEnabled(makeState({ globalDefault: false, override: true }), 'conv-1')).toBe(
            true
        );
    });

    it('ignores a stale pending choice once the conversation exists', () => {
        expect(resolveArtifactCreationEnabled(makeState({ override: true, pending: false }), 'conv-1')).toBe(true);
    });

    it('uses the pending choice when there is no conversation id', () => {
        expect(resolveArtifactCreationEnabled(makeState({ globalDefault: true, pending: false }), undefined)).toBe(
            false
        );
        expect(resolveArtifactCreationEnabled(makeState({ globalDefault: false }), undefined)).toBe(false);
    });

    it('uses the pending choice when the conversation id is not in the store yet', () => {
        expect(resolveArtifactCreationEnabled(makeState({ pending: false }), 'conv-unknown')).toBe(false);
    });
});

describe('initializeNewSpaceAndConversation', () => {
    function createdConversation(dispatch: jest.Mock): Conversation | undefined {
        const call = dispatch.mock.calls.find(([action]) => {
            return action.type === addConversation.type;
        });
        return call?.[0].payload;
    }

    it('includes the pending composer choice in the first version of the conversation', () => {
        const dispatch = jest.fn();
        initializeNewSpaceAndConversation('2026-01-01T00:00:00.000Z')(dispatch, () => {
            return makeState({ pending: false });
        });

        expect(createdConversation(dispatch)?.artifactCreation).toBe(false);
        expect(dispatch).toHaveBeenCalledWith(clearPendingArtifactCreation());
    });

    it('leaves the field unset when the user did not touch the toggle', () => {
        const dispatch = jest.fn();
        initializeNewSpaceAndConversation('2026-01-01T00:00:00.000Z')(dispatch, () => {
            return makeState({});
        });

        expect(createdConversation(dispatch)).not.toHaveProperty('artifactCreation');
        expect(dispatch).not.toHaveBeenCalledWith(clearPendingArtifactCreation());
    });
});

describe('conversation artifactCreation serialization', () => {
    const base = { id: 'conv-1', spaceId: 'space-1', createdAt: '2026-01-01T00:00:00.000Z', title: 'Chat' };

    it('keeps an explicit false so "off for this chat" survives a round trip', () => {
        const conversation = { ...base, artifactCreation: false } as Conversation;

        expect(getConversationPriv(conversation)).toEqual({ title: 'Chat', artifactCreation: false });
        expect(cleanConversation(conversation).artifactCreation).toBe(false);
    });

    it('omits the field when the conversation follows the global default', () => {
        const conversation = { ...base } as Conversation;

        expect(getConversationPriv(conversation)).toEqual({ title: 'Chat' });
        expect('artifactCreation' in cleanConversation(conversation)).toBe(false);
    });
});
