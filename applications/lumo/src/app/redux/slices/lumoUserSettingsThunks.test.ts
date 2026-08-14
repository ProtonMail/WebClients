import type { LumoState } from '../store';
import { appendGeneratedMemoriesThunk } from './lumoUserSettingsThunks';
import type { Memory } from './lumoUserSettingsTypes';

const existing: Memory = {
    id: 'existing',
    content: 'Prefers concise answers',
    createdAt: 1,
    source: 'generated',
};

const makeState = (memories: Memory[]) =>
    ({
        lumoUserSettings: { memories },
    }) as LumoState;

describe('appendGeneratedMemoriesThunk', () => {
    it('advances the cursor when a generated memory is persisted', () => {
        const dispatch = jest.fn();
        const generated: Memory = {
            id: 'new',
            content: 'Uses Rust for command line applications',
            createdAt: 2,
            source: 'generated',
        };

        const added = appendGeneratedMemoriesThunk([generated], '2026-08-14T12:00:00.000Z')(
            dispatch,
            () => makeState([existing])
        );

        expect(added).toBe(1);
        expect(dispatch.mock.calls[0]?.[0].payload).toMatchObject({
            memoryLastProcessedMessageAt: '2026-08-14T12:00:00.000Z',
        });
    });

    it('does not advance the cursor when no generated memory is persisted', () => {
        const dispatch = jest.fn();

        const added = appendGeneratedMemoriesThunk(
            [{ ...existing, id: 'duplicate' }],
            '2026-08-14T12:00:00.000Z'
        )(dispatch, () => makeState([existing]));

        expect(added).toBe(0);
        expect(dispatch.mock.calls[0]?.[0].payload).not.toHaveProperty('memoryLastProcessedMessageAt');
    });
});
