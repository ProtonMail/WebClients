import type { Task } from 'redux-saga';
import { runSaga } from 'redux-saga';

import * as folderRequests from '../../../lib/folders/folders.requests';
import * as inviteRequests from '../../../lib/invites/invite.requests';
import * as itemRequests from '../../../lib/items/item.requests';
import * as shareParser from '../../../lib/shares/share.parser';
import type { ShareGetResponse } from '../../../types/api/pass';
import type { FolderData } from '../../../types/data/folders';
import type { Invite } from '../../../types/data/invites';
import { ShareType } from '../../../types/data/shares';
import { createTestItem } from '../../../utils/tests/fixtures/items';
import { createTestShare } from '../../../utils/tests/fixtures/shares';
import { sagaSetup } from '../../../utils/tests/saga';
import { inviteAccept } from '../../actions/creators/invite';
import type { RootSagaOptions } from '../../types';
import acceptInviteSaga from './invite-accept.saga';

vi.mock('../../../lib/invites/invite.requests', async () => ({
    ...(await vi.importActual('../../../lib/invites/invite.requests')),
    acceptInvite: vi.fn(),
}));

vi.mock('../../../lib/shares/share.parser', async () => ({
    ...(await vi.importActual('../../../lib/shares/share.parser')),
    parseShareResponse: vi.fn(),
}));

vi.mock('../../../lib/folders/folders.requests', async () => ({
    ...(await vi.importActual('../../../lib/folders/folders.requests')),
    requestFoldersForShareId: vi.fn(),
}));

vi.mock('../../../lib/items/item.requests', async () => ({
    ...(await vi.importActual('../../../lib/items/item.requests')),
    requestItemsForShareId: vi.fn(),
}));

const acceptInvite = vi.mocked(inviteRequests.acceptInvite);
const parseShareResponse = vi.mocked(shareParser.parseShareResponse);
const requestFoldersForShareId = vi.mocked(folderRequests.requestFoldersForShareId);
const requestItemsForShareId = vi.mocked(itemRequests.requestItemsForShareId);

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
        vi.clearAllMocks();
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
