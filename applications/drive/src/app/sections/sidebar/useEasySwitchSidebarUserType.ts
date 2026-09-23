import { useEffect, useState } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';

import { useGetUser } from '@proton/account/user/hooks';
import { getDrive } from '@proton/drive';
import { handleSdkError, sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { APPS } from '@proton/shared/lib/constants';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage';
import { useFlag } from '@proton/unleash/useFlag';

import {
    EASY_SWITCH_NEW_USER_ACCOUNT_AGE_DAYS,
    type EasySwitchSidebarUserInfoInput,
    NO_USER_INFO,
    getEasySwitchSidebarUserType,
} from './getEasySwitchSidebarUserType';

const EVENTS_CONTEXT = 'easySwitchSidebar';

const getMyFilesRootStats = async (signal: AbortSignal) => {
    try {
        const drive = getDrive();
        const rootNode = await drive.getMyFilesRootFolder();
        const childUids = await Array.fromAsync(drive.iterateFolderChildrenNodeUids(rootNode.uid, undefined, signal));

        return {
            uid: rootNode.uid,
            itemCount: childUids.length,
            ageDays: differenceInDays(new Date(), rootNode.creationTime),
        };
    } catch (error) {
        handleSdkError(error, { showNotification: false });
        return undefined;
    }
};

export const useEasySwitchSidebarUserType = (hasCompletedImport: boolean) => {
    const getUser = useGetUser();
    const isRolloutActive = useFlag('EasySwitchB2CForDriveWebSidebarRollout');
    const [input, setInput] = useState<EasySwitchSidebarUserInfoInput>();
    const [emptyRootUid, setEmptyRootUid] = useState<string>();

    useEffect(
        function checkRootNodeItemCount() {
            if (hasCompletedImport) {
                setInput(undefined);
                return;
            }

            const abortController = new AbortController();

            const compute = async () => {
                const [user, rootStats] = await Promise.all([getUser(), getMyFilesRootStats(abortController.signal)]);
                if (!rootStats) {
                    return undefined;
                }

                setEmptyRootUid(rootStats.itemCount === 0 ? rootStats.uid : undefined);

                return {
                    isRolloutActive,
                    isNewUser:
                        differenceInDays(new Date(), fromUnixTime(user.CreateTime)) <=
                        EASY_SWITCH_NEW_USER_ACCOUNT_AGE_DAYS,
                    rootItemCount: rootStats.itemCount,
                    rootAgeDays: rootStats.ageDays,
                    usedDriveSpace: getAppSpace(getSpace(user), APPS.PROTONDRIVE).usedSpace,
                };
            };

            compute().then(setInput).catch(sendErrorReport);

            return () => abortController.abort();
        },
        [getUser, hasCompletedImport, isRolloutActive]
    );

    useEffect(
        function subscribeToNodesEvent() {
            if (!emptyRootUid) {
                return;
            }

            const busDriver = getBusDriver();
            void busDriver.subscribeSdkEventsMyUpdates(EVENTS_CONTEXT);

            const unsubscribe = busDriver.subscribe(BusDriverEventName.CREATED_NODES, async (event) => {
                if (event.items.some((item) => item.parentUid === emptyRootUid && !item.isTrashed)) {
                    setInput((prev) => prev && { ...prev, rootItemCount: 1 });
                    setEmptyRootUid(undefined);
                }
            });

            return () => {
                unsubscribe();
                void busDriver.unsubscribeSdkEventsMyUpdates(EVENTS_CONTEXT);
            };
        },
        [emptyRootUid]
    );

    return input ? getEasySwitchSidebarUserType(input) : NO_USER_INFO;
};
