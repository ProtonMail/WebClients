import type { Task } from 'redux-saga';
import { runSaga } from 'redux-saga';

import * as folderRequests from '../../../lib/folders/folders.requests';
import * as inviteRequests from '../../../lib/invites/invite.requests';
import * as itemRequests from '../../../lib/items/item.requests';
import { createTestItem } from '../../../lib/items/item.test.utils';
import * as shareParser from '../../../lib/shares/share.parser';
import { createTestShare } from '../../../lib/shares/share.test.utils';
import type { FolderData, Invite, ShareGetResponse } from '../../../types';
import { ShareType } from '../../../types';
import { inviteAccept } from '../../actions';
import type { RootSagaOptions } from '../../types';
import { sagaSetup } from '../testing';
import acceptInviteSaga from './invite-accept.saga';

jest.mock('../../../lib/invites/invite.requests', () => ({
    ...jest.requireActual('../../../lib/invites/invite.requests'),
    acceptInvite: jest.fn(),
}));

jest.mock('../../../lib/shares/share.parser', () => ({
    ...jest.requireActual('../../../lib/shares/share.parser'),
    parseShareResponse: jest.fn(),
}));

jest.mock('../../../lib/folders/folders.requests', () => ({
    ...jest.requireActual('../../../lib/folders/folders.requests'),
    requestFoldersForShareId: jest.fn(),
}));

jest.mock('../../../lib/items/item.requests', () => ({
    ...jest.requireActual('../../../lib/items/item.requests'),
    requestItemsForShareId: jest.fn(),
}));

const acceptInvite = jest.mocked(inviteRequests.acceptInvite);
const parseShareResponse = jest.mocked(shareParser.parseShareResponse);
const requestFoldersForShareId = jest.mocked(folderRequests.requestFoldersForShareId);
const requestItemsForShareId = jest.mocked(itemRequests.requestItemsForShareId);

const inviteToken = 'token-1';
const invite = { inviteToken, targetType: ShareType.Vault, keys: [] } as unknown as Invite;
const share = createTestShare({ shareId: 's1', targetType: ShareType.Vault });
const items = [createTestItem('login', { itemId: 'i1', shareId: 's1' })];
const folders = [{ folderId: 'f1', shareId: 's1' } as FolderData];

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('invite-accept saga', () => {
    let saga: ReturnType<typeof sagaSetup>;
    let task: Task;

    const run = async () => {
        saga.options.dispatch(inviteAccept.intent({ inviteToken, inviteType: 'user' } as any));
        await flush();
        return saga.dispatched;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        acceptInvite.mockResolvedValue({} as ShareGetResponse);
        parseShareResponse.mockResolvedValue(share);
        requestFoldersForShareId.mockResolvedValue(folders);
        requestItemsForShareId.mockResolvedValue(items);

        saga = sagaSetup({ invites: { [inviteToken]: invite } });
        task = runSaga(saga.options, acceptInviteSaga, { getTelemetry: () => null } as unknown as RootSagaOptions);
    });

    afterEach(() => task.cancel());

    test('dispatches success with both folders and items', async () => {
        const dispatched = await run();

        expect(requestFoldersForShareId).toHaveBeenCalledWith('s1');
        expect(requestItemsForShareId).toHaveBeenCalledWith('s1', expect.any(Function));
        expect(dispatched).toContainEqual(expect.objectContaining({ payload: { inviteToken, share, items, folders } }));
    });

    test('dispatches failure when the folder request throws', async () => {
        requestFoldersForShareId.mockRejectedValue(new Error('boom'));
        const dispatched = await run();

        expect(requestItemsForShareId).not.toHaveBeenCalled();
        expect(dispatched).toContainEqual(expect.objectContaining({ type: inviteAccept.failure.type }));
    });
});
