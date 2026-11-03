import type { MessageMap } from '../redux/slices/core/messages';
import { type Message, Role } from '../types';
import { buildLinearChain } from './index';

const message = (id: string, parentId: string | undefined, minute: number, role = Role.User): Message => ({
    id,
    parentId,
    conversationId: 'conversation',
    createdAt: new Date(Date.UTC(2026, 9, 1, 10, minute)).toISOString(),
    role,
    content: id,
});

const toMap = (messages: Message[]): MessageMap => Object.fromEntries(messages.map((m) => [m.id, m]));

const ids = (chain: Message[]) => chain.map((m) => m.id);

const chainOf = (messages: Message[], preferredSiblings: string[] = []) =>
    ids(buildLinearChain(toMap(messages), null, preferredSiblings));

function permutations<T>(items: T[]): T[][] {
    if (items.length <= 1) {
        return [items];
    }
    return items.flatMap((item, i) =>
        permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
    );
}

describe('buildLinearChain', () => {
    // The first prompt was edited: the edit is a second root, and the conversation went on from it.
    const original = message('original-prompt', undefined, 0);
    const originalReply = message('original-reply', 'original-prompt', 1, Role.Assistant);
    const edited = message('edited-prompt', undefined, 2);
    const editedReply = message('edited-reply', 'edited-prompt', 3, Role.Assistant);
    const followUp = message('follow-up', 'edited-reply', 4);
    const followUpReply = message('follow-up-reply', 'follow-up', 5, Role.Assistant);
    const all = [original, originalReply, edited, editedReply, followUp, followUpReply];
    const latestChain = ['edited-prompt', 'edited-reply', 'follow-up', 'follow-up-reply'];

    describe('without a selected sibling', () => {
        it('returns an empty chain for an empty conversation', () => {
            expect(buildLinearChain({}, null, [])).toEqual([]);
        });

        it('returns a single message', () => {
            expect(chainOf([original])).toEqual(['original-prompt']);
        });

        it('returns a linear conversation in order', () => {
            const linear = [original, originalReply];
            expect(chainOf(linear)).toEqual(['original-prompt', 'original-reply']);
            expect(chainOf([...linear].reverse())).toEqual(['original-prompt', 'original-reply']);
        });

        it('follows the most recent branch whatever the order messages were loaded in', () => {
            expect(chainOf(all)).toEqual(latestChain);
            expect(chainOf([...all].reverse())).toEqual(latestChain);
        });

        it('follows the most recent branch for every load order', () => {
            for (const order of permutations(all)) {
                expect(chainOf(order)).toEqual(latestChain);
            }
        });

        it('follows the original root when the conversation went on there after the edit', () => {
            const backOnOriginal = message('back-on-original', 'original-reply', 6);
            for (const order of permutations([...all, backOnOriginal])) {
                expect(chainOf(order)).toEqual(['original-prompt', 'original-reply', 'back-on-original']);
            }
        });

        it('picks the most recent of three roots', () => {
            const secondEdit = message('second-edit', undefined, 7);
            const secondEditReply = message('second-edit-reply', 'second-edit', 8, Role.Assistant);
            const messages = [...all, secondEdit, secondEditReply];
            expect(chainOf(messages)).toEqual(['second-edit', 'second-edit-reply']);
            expect(chainOf([...messages].reverse())).toEqual(['second-edit', 'second-edit-reply']);
        });

        it('follows the most recent branch when a later message was edited', () => {
            // follow-up was edited: both versions share edited-reply as parent.
            const editedFollowUp = message('edited-follow-up', 'edited-reply', 6);
            const editedFollowUpReply = message('edited-follow-up-reply', 'edited-follow-up', 7, Role.Assistant);
            const messages = [...all, editedFollowUp, editedFollowUpReply];
            const expected = ['edited-prompt', 'edited-reply', 'edited-follow-up', 'edited-follow-up-reply'];
            expect(chainOf(messages)).toEqual(expected);
            expect(chainOf([...messages].reverse())).toEqual(expected);
        });

        it('ends on a leaf even when a parent is dated after its child', () => {
            // Clock skew between devices: the reply is stamped earlier than its prompt.
            const skewedPrompt = message('skewed-prompt', undefined, 30);
            const skewedReply = message('skewed-reply', 'skewed-prompt', 20, Role.Assistant);
            expect(chainOf([...all, skewedPrompt, skewedReply])).toEqual(['skewed-prompt', 'skewed-reply']);
        });

        it('ignores messages whose parent is missing', () => {
            const orphan = message('orphan', 'missing-parent', 59);
            const orphanChild = message('orphan-child', 'orphan', 59);
            expect(chainOf([...all, orphan, orphanChild])).toEqual(latestChain);
        });
    });

    describe('with a selected sibling', () => {
        it('shows the other root when the user selects it', () => {
            expect(chainOf(all, ['original-prompt'])).toEqual(['original-prompt', 'original-reply']);
        });

        it('shows the selected root whatever the order messages were loaded in', () => {
            for (const order of permutations(all)) {
                expect(chainOf(order, ['original-prompt'])).toEqual(['original-prompt', 'original-reply']);
            }
        });

        it('follows the most recent leaf below the selected message', () => {
            const branchA = message('branch-a', 'original-reply', 6);
            const branchB = message('branch-b', 'original-reply', 7);
            expect(chainOf([...all, branchA, branchB], ['original-prompt'])).toEqual([
                'original-prompt',
                'original-reply',
                'branch-b',
            ]);
        });

        it('stops at the selected message when it is a leaf', () => {
            const branchA = message('branch-a', 'original-reply', 6);
            const branchB = message('branch-b', 'original-reply', 7);
            expect(chainOf([...all, branchA, branchB], ['branch-a'])).toEqual([
                'original-prompt',
                'original-reply',
                'branch-a',
            ]);
        });

        it('uses the deepest selection when selections are nested', () => {
            const branchA = message('branch-a', 'original-reply', 6);
            const branchB = message('branch-b', 'original-reply', 7);
            const messages = [...all, branchA, branchB];
            const expected = ['original-prompt', 'original-reply', 'branch-a'];
            expect(chainOf(messages, ['original-prompt', 'branch-a'])).toEqual(expected);
            expect(chainOf(messages, ['branch-a', 'original-prompt'])).toEqual(expected);
        });

        it('keeps the first selection when a later one is on another branch', () => {
            expect(chainOf(all, ['original-prompt', 'follow-up'])).toEqual(['original-prompt', 'original-reply']);
        });

        it('ignores selections that are not in the conversation', () => {
            expect(chainOf(all, ['deleted-message'])).toEqual(latestChain);
        });

        it('does not crash when a selected message has a missing ancestor', () => {
            const orphan = message('orphan', 'missing-parent', 6);
            const orphanChild = message('orphan-child', 'orphan', 7);
            expect(chainOf([...all, orphan, orphanChild], ['original-prompt', 'orphan-child'])).toEqual([
                'original-prompt',
                'original-reply',
            ]);
        });
    });

    describe('with an explicit message id', () => {
        it('walks back from that message and ignores selections', () => {
            expect(ids(buildLinearChain(toMap(all), 'edited-reply', ['original-prompt']))).toEqual([
                'edited-prompt',
                'edited-reply',
            ]);
        });

        it('returns an empty chain for undefined', () => {
            expect(buildLinearChain(toMap(all), undefined, [])).toEqual([]);
        });

        it('returns an empty chain for an unknown id', () => {
            expect(buildLinearChain(toMap(all), 'unknown', [])).toEqual([]);
        });
    });
});
