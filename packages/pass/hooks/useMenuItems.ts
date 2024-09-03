import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { syncIntent } from '@proton/pass//store/actions';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePasswordContext } from '@proton/pass/components/Password/PasswordProvider';
import { PASS_ANDROID_URL, PASS_IOS_URL, PASS_REDDIT_URL, PASS_REQUEST_URL, PASS_X_URL } from '@proton/pass/constants';
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
        feedback?: MenuItem[];
    };
};

export const useMenuItems = ({
    onAction = noop,
    extra = {},
}: MenuItemsOptions): Record<'feedback' | 'download' | 'advanced', MenuItem[]> => {
    const { openSettings } = usePassCore();
    const passwordContext = usePasswordContext();
    const dispatch = useDispatch();
    const withAction = withTap(onAction);

    return {
        feedback: [
            {
                icon: 'paper-plane',
                label: c('Action').t`Send us a message`,
                onClick: withAction(() => openSettings?.('support')),
            },
            {
                icon: 'brand-twitter',
                label: c('Action').t`Write us on Twitter`,
                url: PASS_X_URL,
            },
            {
                icon: 'brand-reddit',
                label: c('Action').t`Write us on Reddit`,
                url: PASS_REDDIT_URL,
            },
            {
                icon: 'rocket',
                label: c('Action').t`Request a feature`,
                url: PASS_REQUEST_URL,
            },
            ...(extra.feedback ?? []),
        ],
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
                onClick: withAction(passwordContext.history.open),
            },
            {
                icon: 'arrow-rotate-right',
                label: c('Action').t`Manually sync your data`,
                onClick: withAction(() => dispatch(syncIntent(SyncType.FULL))),
            },
            ...(extra.advanced ?? []),
        ],
    };
};
