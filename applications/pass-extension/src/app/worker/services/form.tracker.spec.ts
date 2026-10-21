import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { AutofillMode } from '@proton/pass/types/protobuf';
import { AutosaveMode } from '@proton/pass/types/worker/autosave';
import type { FormCredentials } from '@proton/pass/types/worker/form';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { getMockItemRevision, getMockState, mockShareId, sender, setMockMessageSender } from '../../../__mocks__/mocks';
import { expectMessageSuccess } from '../../../__mocks__/utils';
import { contentScriptMessage, sendMessage } from '../../../lib/message/send-message';
import { WorkerMessageType } from '../../../types/messages';
import store from '../__mocks__/store';
import { WorkerContext } from '../context/inject';
import { createAutoSaveService } from './autosave';
import { createFormTrackerService } from './form.tracker';

jest.mock('../channel');
jest.mock('./main-frame.tracker', () => ({ createMainFrameRequestTracker: jest.fn() }));
jest.mock('./xmlhttp-request.tracker', () => ({ createXMLHTTPRequestTracker: () => ({ reset: jest.fn() }) }));

const TAB_ID = 1;
const credentials: FormCredentials = { userIdentifier: 'test@proton.me', password: 'p4ssw0rd' };

/** Browsers attach the verified `origin` next to the sender `url` */
const setSenderPage = (url: string) => {
    setMockMessageSender(url, TAB_ID);
    Object.assign(sender, { origin: new URL(url).origin });
};

const stage = (data: FormCredentials) =>
    sendMessage(
        contentScriptMessage({
            type: WorkerMessageType.FORM_ENTRY_STAGE,
            payload: { formId: uniqueId(), data, submit: true, type: 'login', reason: 'test' },
        })
    );

const commit = () =>
    sendMessage(contentScriptMessage({ type: WorkerMessageType.FORM_ENTRY_COMMIT, payload: { reason: 'test' } }));

describe('FormTrackerService [worker]', () => {
    const autosave = createAutoSaveService();
    const formTracker = createFormTrackerService();

    beforeEach(() => {
        const item = itemBuilder('login');
        item.get('metadata').set('name', 'Domain.com');
        item.get('content')
            .set('itemEmail', credentials.userIdentifier)
            .set('password', credentials.password)
            .set('autofillUrls', [{ url: 'https://domain.com/form', mode: AutofillMode.StartWith }]);

        const state = getMockState();
        const revision = getMockItemRevision({ data: item.data });
        state.items.byShareId[mockShareId][revision.itemId] = revision;
        store.getState.mockReturnValue(state);

        WorkerContext.set({ getState: () => ({ authorized: true }), service: { store, autosave } } as any);
    });

    afterEach(() => {
        formTracker.clear();
        WorkerContext.clear();
        store.getState.mockReset();
    });

    test('stages the entry on the full form page URL', async () => {
        setSenderPage('https://domain.com/form/login?step=1');
        const response = await stage(credentials);

        expectMessageSuccess(response);
        expect(response.submission?.url).toEqual('https://domain.com/form/login?step=1');
    });

    test('keeps the URL of the last step on multi-step forms', async () => {
        setSenderPage('https://domain.com/form/user');
        await stage({ userIdentifier: credentials.userIdentifier, password: '' });

        setSenderPage('https://domain.com/form/password');
        const response = await stage({ userIdentifier: '', password: credentials.password });

        expectMessageSuccess(response);
        expect(response.submission?.url).toEqual('https://domain.com/form/password');
        expect(response.submission?.data).toEqual(credentials);
    });

    test('should not prompt on commit from a result page outside the StartWith rule', async () => {
        setSenderPage('https://domain.com/form/login');
        await stage(credentials);

        setSenderPage('https://domain.com/dashboard');
        const response = await commit();

        expectMessageSuccess(response);
        expect(response.submission).toBeNull();
    });

    test('should prompt for update on commit when the password changed', async () => {
        setSenderPage('https://domain.com/form/login');
        await stage({ ...credentials, password: 'changed' });

        setSenderPage('https://domain.com/dashboard');
        const response = await commit();

        expectMessageSuccess(response);
        expect(response.submission?.url).toEqual('https://domain.com/form/login');
        expect(response.submission?.autosave).toEqual({
            shouldPrompt: true,
            data: {
                type: AutosaveMode.UPDATE,
                candidates: [expect.objectContaining({ name: 'Domain.com', url: 'https://domain.com/form' })],
            },
        });
    });
});
