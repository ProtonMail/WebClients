import type { Task } from 'redux-saga';
import { runSaga } from 'redux-saga';

import { shareEventDelete, sharesEventNew } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { ItemRevision, Share } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import type { Group } from '@proton/shared/lib/interfaces';

import notificationForShares from './shares-notification.saga';

describe('notif-shares saga', () => {
    const onNotification = jest.fn();

    const group = {
        ID: 'groupId',
        Name: 'groupName',
    } as Group;

    const vault = {
        shareId: 'vaultShareId',
        targetType: ShareType.Vault,
        groupId: group.ID,
        content: { name: 'vaultName' },
    } as Share<ShareType.Vault>;

    const item = {
        shareId: 'itemShareId',
        targetId: 'itemId',
        targetType: ShareType.Item,
        groupId: group.ID,
    } as Share<ShareType.Item>;

    const itemRevision = { itemId: item.targetId, shareId: item.shareId, data: { metadata: { name: 'itemName' } } } as ItemRevision;

    let saga: ReturnType<typeof sagaSetup>;
    let dispatch: (action: any) => void;
    let task: Task;

    beforeEach(() => {
        saga = sagaSetup({
            organization: { groups: [group] },
            items: { byShareId: { [item.shareId]: { [item.targetId]: itemRevision } }, byOptimisticId: {} },
            shares: { [vault.shareId]: vault, [item.shareId]: item },
        });
        const options = { onNotification } as unknown as RootSagaOptions;
        task = runSaga(saga.options, notificationForShares, options);
        dispatch = saga.options.dispatch;
        jest.clearAllMocks();
    });

    afterEach(() => {
        task.cancel();
    });

    describe('new shares', () => {
        it('should not show notification when no new shares', () => {
            dispatch(sharesEventNew({ shares: {}, items: {} }));
            expect(onNotification).not.toHaveBeenCalled();
        });

        it('should not show notification for non group shares', () => {
            dispatch(sharesEventNew({ shares: { [vault.shareId]: { ...vault, groupId: null } }, items: {} }));
            expect(onNotification).not.toHaveBeenCalled();
        });

        it('should show notification for a single group vault sharing', () => {
            dispatch(sharesEventNew({ shares: { [vault.shareId]: vault }, items: {} }));
            expect(onNotification).toHaveBeenCalled();
            expect(onNotification.mock.lastCall[0].text).toBe(
                `You now have access to "Vault ${vault.content.name}" because your group ${group.Name} has been granted access.`
            );
        });

        it('should show notification for a single group item sharing', () => {
            dispatch(sharesEventNew({ shares: { [item.shareId]: item }, items: {} }));
            expect(onNotification).toHaveBeenCalled();
            expect(onNotification.mock.lastCall[0].text).toBe(
                `You now have access to "Item ${itemRevision.data.metadata.name}" because your group ${group.Name} has been granted access.`
            );
        });

        it('should show multiple notifications for a multiple sharings', () => {
            dispatch(sharesEventNew({ shares: { [vault.shareId]: vault, [item.shareId]: item }, items: {} }));
            expect(onNotification).toHaveBeenCalledTimes(2);
            expect(onNotification.mock.calls[0][0].text).toBe(
                `You now have access to "Vault ${vault.content.name}" because your group ${group.Name} has been granted access.`
            );
            expect(onNotification.mock.calls[1][0].text).toBe(
                `You now have access to "Item ${itemRevision.data.metadata.name}" because your group ${group.Name} has been granted access.`
            );
        });
    });

    describe('deleted share', () => {
        it('should show notification when non group vault share deleted', () => {
            const { groupId } = (saga.options.getState() as State).shares[vault.shareId];
            (saga.options.getState() as State).shares[vault.shareId].groupId = null;
            dispatch(shareEventDelete(vault));
            expect(onNotification).toHaveBeenCalled();
            expect(onNotification.mock.lastCall[0].text).toBe(`Vault \"${vault.content.name}\" was removed.`);
            (saga.options.getState() as State).shares[vault.shareId].groupId = groupId;
        });

        it('should show notification when non group item share deleted', () => {
            const { groupId } = (saga.options.getState() as State).shares[item.shareId];
            (saga.options.getState() as State).shares[item.shareId].groupId = null;
            dispatch(shareEventDelete(item));
            expect(onNotification).toHaveBeenCalled();
            expect(onNotification.mock.lastCall[0].text).toBe(`An item previously shared with you was removed.`);
            (saga.options.getState() as State).shares[item.shareId].groupId = groupId;
        });

        it('should show notification when a group vault share deleted', () => {
            dispatch(shareEventDelete(vault));
            expect(onNotification).toHaveBeenCalled();
            expect(onNotification.mock.lastCall[0].text).toBe(
                `You no longer have access to some vaults or items because your group ${group.Name}'s access was removed.`
            );
        });

        it('should show notification when a group item share deleted', () => {
            dispatch(shareEventDelete(item));
            expect(onNotification).toHaveBeenCalled();
            expect(onNotification.mock.lastCall[0].text).toBe(
                `You no longer have access to some vaults or items because your group ${group.Name}'s access was removed.`
            );
        });
    });
});
