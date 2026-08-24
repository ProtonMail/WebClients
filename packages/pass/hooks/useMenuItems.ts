import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { Clients, clients } from '@proton/shared/lib/pass/constants';
import noop from '@proton/utils/noop';

import { usePasswordHistoryActions } from '../components/Password/PasswordHistoryActions';
import { PASS_ANDROID_URL, PASS_IOS_URL } from '../constants';
import { syncIntent } from '../store/actions';
import { withTap } from '../utils/fp/pipe';

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

export const useMenuItems = ({ onAction = noop, extra = {} }: MenuItemsOptions = {}): Record<
    'download' | 'advanced',
    MenuItem[]
> => {
    const dispatch = useDispatch();
    const passwordHistory = usePasswordHistoryActions();

    return useMemo(() => {
        const withAction = withTap(onAction);

        return {
            download: [
                {
                    icon: 'brand-android',
                    label: c('Action').t`${PASS_SHORT_APP_NAME} for Android`,
                    url: PASS_ANDROID_URL,
                },
                {
                    icon: 'brand-apple',
                    label: c('Action').t`${PASS_SHORT_APP_NAME} for iOS`,
                    url: PASS_IOS_URL,
                },
                ...(DESKTOP_BUILD
                    ? []
                    : ([
                          {
                              icon: 'brand-windows',
                              label: `${PASS_SHORT_APP_NAME} for Windows`,
                              url: clients[Clients.Windows].link,
                          },
                          {
                              icon: 'brand-mac',
                              label: `${PASS_SHORT_APP_NAME} for macOS`,
                              url: clients[Clients.macOS].link,
                          },
                          {
                              icon: 'brand-linux',
                              label: `${PASS_SHORT_APP_NAME} for Linux`,
                              url: clients[Clients.Linux].link,
                          },
                      ] as const)),
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
                    onClick: withAction(() => dispatch(syncIntent())),
                },
                ...(extra.advanced ?? []),
            ],
        };
    }, [onAction, passwordHistory.open]);
};
