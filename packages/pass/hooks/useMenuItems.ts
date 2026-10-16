import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcKeyHistory } from '@proton/icons/icons/IcKeyHistory';
import noop from '@proton/utils/noop';

import { usePasswordHistoryActions } from '../components/Password/PasswordHistoryActions';
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
    };
};

export const useMenuItems = ({ onAction = noop, extra = {} }: MenuItemsOptions = {}): Record<
    'advanced',
    MenuItem[]
> => {
    const dispatch = useDispatch();
    const passwordHistory = usePasswordHistoryActions();

    return useMemo(() => {
        const withAction = withTap(onAction);

        return {
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
