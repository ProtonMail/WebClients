import { act, renderHook, waitFor } from '@testing-library/react';
import { getUnixTime } from 'date-fns';

import { useGetUser } from '@proton/account/user/hooks';
import { getDrive } from '@proton/drive';
import type { BusDriverClient } from '@proton/drive/modules/busDriver';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import { EasySwitchUserType, NO_USER_INFO } from './getEasySwitchSidebarUserType';
import { useEasySwitchSidebarUserType } from './useEasySwitchSidebarUserType';

jest.mock('@proton/drive', () => ({
    ...jest.requireActual('@proton/drive'),
    getDrive: jest.fn(),
}));
jest.mock('@proton/account/user/hooks', () => ({ useGetUser: jest.fn() }));
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: jest.fn() }));

const ROOT_UID = 'root-uid';

const subscribeToTreeEvents = jest.fn(async () => ({ dispose: () => {} }));

const emitCreatedNode = (item: { parentUid: string; isTrashed?: boolean }) =>
    act(() =>
        getBusDriver().emit(
            { type: BusDriverEventName.CREATED_NODES, items: [{ uid: 'new-node-uid', ...item }] },
            {} as BusDriverClient
        )
    );

const renderWithEmptyRoot = async () => {
    const hook = renderHook(() => useEasySwitchSidebarUserType(false));
    await waitFor(() => expect(subscribeToTreeEvents).toHaveBeenCalled());
    return hook;
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFlag).mockReturnValue(true);
    jest.mocked(useGetUser).mockReturnValue(async () => ({ CreateTime: getUnixTime(new Date()) }) as UserModel);
    jest.mocked(getDrive).mockReturnValue({
        getMyFilesRootFolder: async () => ({ uid: ROOT_UID, creationTime: new Date(), treeEventScopeId: 'scope-id' }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        iterateFolderChildrenNodeUids: async function* () {},
        subscribeToTreeEvents,
    } as unknown as ReturnType<typeof getDrive>);
});

describe('useEasySwitchSidebarUserType', () => {
    it('shows the entry once the first item is created in the empty root', async () => {
        const { result } = await renderWithEmptyRoot();
        expect(result.current).toEqual(NO_USER_INFO);

        await emitCreatedNode({ parentUid: ROOT_UID });

        expect(result.current).toEqual({ userType: EasySwitchUserType.NewUser, showNewBadge: true });
    });

    it('ignores items created outside the root or trashed', async () => {
        const { result } = await renderWithEmptyRoot();

        await emitCreatedNode({ parentUid: 'other-folder-uid' });
        await emitCreatedNode({ parentUid: ROOT_UID, isTrashed: true });

        expect(result.current).toEqual(NO_USER_INFO);
    });

    it('stops listening to events once the root is not empty anymore', async () => {
        const unsubscribe = jest.spyOn(getBusDriver(), 'unsubscribeSdkEventsMyUpdates');
        await renderWithEmptyRoot();

        await emitCreatedNode({ parentUid: ROOT_UID });

        expect(unsubscribe).toHaveBeenCalled();
    });
});
