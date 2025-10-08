import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';
import { syncIntent } from '@proton/pass//store/actions';
import { usePasswordHistoryActions } from '@proton/pass/components/Password/PasswordHistoryActions';
import { PASS_ANDROID_URL, PASS_IOS_URL } from '@proton/pass/constants';
import { SyncType } from '@proton/pass/store/sagas/client/sync';
import { withTap } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

export type MenuItem = {
    icon: IconName;
    label: string;
    url?: string;
    onClick?: () => void;
};

type MenuItemsOptions = {
    onAction?: () => void;
    extra?: {
        advanced?: MenuItem[];
        download?: MenuItem[];
    };
};

export const useMenuItems = ({
    onAction = noop,
    extra = {},
}: MenuItemsOptions): Record<'download' | 'advanced', MenuItem[]> => {
    const dispatch = useDispatch();
    const passwordHistory = usePasswordHistoryActions();

    return useMemo(() => {
        const withAction = withTap(onAction);

        return {
            download: [
                {
                    icon: 'brand-android',
                    label: c('Action').t`Pass for Android`,
                    url: PASS_ANDROID_URL,
                },
                {
                    icon: 'brand-apple',
                    label: c('Action').t`Pass for iOS`,
                    url: PASS_IOS_URL,
                },
                ...(extra.download ?? []),
            ],
            advanced: [
                {
                    icon: 'key-history',
                    label: c('Action').t`Generated passwords`,
                    onClick: withAction(passwordHistory.open),
                },
                {
                    icon: 'arrow-rotate-right',
                    label: c('Action').t`Manually sync your data`,
                    onClick: withAction(() => dispatch(syncIntent(SyncType.FULL))),
                },
                ...(extra.advanced ?? []),
            ],
        };
    }, [onAction, passwordHistory.open]);
};
