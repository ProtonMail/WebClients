import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcBrandAndroid } from '@proton/icons/icons/IcBrandAndroid';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandLinux } from '@proton/icons/icons/IcBrandLinux';
import { IcBrandMac } from '@proton/icons/icons/IcBrandMac';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import { IcKeyHistory } from '@proton/icons/icons/IcKeyHistory';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { PASS_ANDROID_URL, PASS_IOS_URL } from '@proton/shared/lib/pass/constants';
import noop from '@proton/utils/noop';

import { clients } from '../clients';
import { usePasswordHistoryActions } from '../components/Password/PasswordHistoryActions';
import { Clients } from '../constants';
import { syncIntent } from '../store/actions';
import { withTap } from '../utils/fp/pipe';

export type MenuItem = {
    icon: IconComponent;
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
                    icon: IcBrandAndroid,
                    label: c('Action').t`${PASS_SHORT_APP_NAME} for Android`,
                    url: PASS_ANDROID_URL,
                },
                {
                    icon: IcBrandApple,
                    label: c('Action').t`${PASS_SHORT_APP_NAME} for iOS`,
                    url: PASS_IOS_URL,
                },
                ...(DESKTOP_BUILD
                    ? []
                    : ([
                          {
                              icon: IcBrandWindows,
                              label: `${PASS_SHORT_APP_NAME} for Windows`,
                              url: clients[Clients.Windows].link,
                          },
                          {
                              icon: IcBrandMac,
                              label: `${PASS_SHORT_APP_NAME} for macOS`,
                              url: clients[Clients.macOS].link,
                          },
                          {
                              icon: IcBrandLinux,
                              label: `${PASS_SHORT_APP_NAME} for Linux`,
                              url: clients[Clients.Linux].link,
                          },
                      ] as const)),
                ...(extra.download ?? []),
            ],
            advanced: [
                {
                    icon: IcKeyHistory,
                    label: c('Action').t`Generated passwords`,
                    onClick: withAction(passwordHistory.open),
                },
                {
                    icon: IcArrowRotateRight,
                    label: c('Action').t`Manually sync your data`,
                    onClick: withAction(() => dispatch(syncIntent())),
                },
                ...(extra.advanced ?? []),
            ],
        };
    }, [onAction, passwordHistory.open]);
};
