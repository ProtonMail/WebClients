import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { usePasswordContext } from '@proton/pass//components/PasswordGenerator/PasswordContext';
import { syncIntent } from '@proton/pass//store/actions';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import {
    PASS_ANDROID_URL,
    PASS_GITHUB_URL,
    PASS_IOS_URL,
    PASS_REDDIT_URL,
    PASS_REQUEST_URL,
    PASS_X_URL,
} from '@proton/pass/constants';
import { withTap } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

export type MenuItem = {
    icon: IconName;
    label: string;
    url?: string;
    onClick?: () => void;
};

type MenuItemsOptions = { onAction?: () => void };

export const useMenuItems = ({
    onAction = noop,
}: MenuItemsOptions): Record<'feedback' | 'download' | 'advanced', MenuItem[]> => {
    const { openSettings } = usePassCore();
    const { openPasswordHistory } = usePasswordContext();
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
                icon: 'brand-github',
                label: c('Action').t`Help us improve`,
                url: PASS_GITHUB_URL,
            },
            {
                icon: 'rocket',
                label: c('Action').t`Request a feature`,
                url: PASS_REQUEST_URL,
            },
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
        ],
        advanced: [
            {
                icon: 'key-history',
                label: c('Action').t`Generated passwords`,
                onClick: withAction(openPasswordHistory),
            },
            {
                icon: 'arrow-rotate-right',
                label: c('Action').t`Manually sync your data`,
                onClick: withAction(() => dispatch(syncIntent())),
            },
        ],
    };
};
