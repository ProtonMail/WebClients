import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { secureLinksRemoveInactive } from '@proton/pass/store/actions';
import { selectInactiveSecureLinksCount } from '@proton/pass/store/selectors';

export const SecureLinkQuickActions: FC = () => {
    const inactiveLinkCount = useSelector(selectInactiveSecureLinksCount);
    const { loading, dispatch } = useRequest(secureLinksRemoveInactive, { initial: true });

    return (
        <QuickActionsDropdown iconSize={4} originalPlacement="bottom-end" pill shape="ghost" size="small">
            <DropdownMenuButton
                danger
                loading={loading}
                disabled={inactiveLinkCount === 0 || loading}
                onClick={() => dispatch()}
                label={
                    inactiveLinkCount
                        ? c('Action').t`Remove all expired links (${inactiveLinkCount})`
                        : c('Action').t`No expired links`
                }
                ellipsis
                icon="trash"
                size="small"
            />
        </QuickActionsDropdown>
    );
};
