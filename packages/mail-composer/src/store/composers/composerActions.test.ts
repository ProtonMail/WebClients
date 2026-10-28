import { COMPOSER_MODE } from '@proton/shared/lib/mail/mailSettings';

import { addComposerAction } from './composerActions';
import { composerActions } from './composersSlice';

const run = async (composerMode: COMPOSER_MODE | undefined, payload: Parameters<typeof addComposerAction>[0]) => {
    const dispatch = jest.fn();
    const getState = () => ({
        mailSettings: { value: composerMode === undefined ? undefined : { ComposerMode: composerMode } },
    });

    await addComposerAction(payload)(dispatch, getState, undefined);

    expect(dispatch).toHaveBeenCalledTimes(1);
    return dispatch.mock.calls[0][0] as ReturnType<typeof composerActions.addComposer>;
};

describe('addComposerAction', () => {
    it('adds an idle composer with empty recipients by default', async () => {
        const action = await run(COMPOSER_MODE.POPUP, {
            ID: 'composer-1',
            messageID: 'message-1',
            senderEmailAddress: 'me@example.com',
            status: 'idle',
        });

        expect(action.type).toBe(composerActions.addComposer.type);
        expect(action.payload).toEqual({
            ID: 'composer-1',
            messageID: 'message-1',
            senderEmailAddress: 'me@example.com',
            changesCount: 0,
            recipients: { ToList: [], CCList: [], BCCList: [] },
            status: 'idle',
            forceOpenScheduleSend: undefined,
            isMaximized: false,
            isMinimized: false,
        });
    });

    it('opens maximized when the user prefers maximized composers', async () => {
        const action = await run(COMPOSER_MODE.MAXIMIZED, { messageID: 'message-1', status: 'loading' });

        expect(action.payload.isMaximized).toBe(true);
    });

    it('opens as a popup while mail settings are not loaded', async () => {
        const action = await run(undefined, { messageID: 'message-1', status: 'loading' });

        expect(action.payload.isMaximized).toBe(false);
    });

    it('generates a unique ID when none is given', async () => {
        const first = await run(COMPOSER_MODE.POPUP, { messageID: 'message-1', status: 'loading' });
        const second = await run(COMPOSER_MODE.POPUP, { messageID: 'message-2', status: 'loading' });

        expect(first.payload.ID).toMatch(/^composer-\d+$/);
        expect(second.payload.ID).not.toBe(first.payload.ID);
    });
});
