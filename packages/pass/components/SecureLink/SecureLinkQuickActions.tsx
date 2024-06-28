import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { itemRemoveInactiveSecureLinks } from '@proton/pass/store/actions';
import { removeInactiveLinksRequest } from '@proton/pass/store/actions/requests';
import { selectInactiveSecureLinkCount } from '@proton/pass/store/selectors';

export const SecureLinkQuickActions: FC = () => {
    const inactiveLinkCount = useSelector(selectInactiveSecureLinkCount);

    const { loading, dispatch } = useRequest(itemRemoveInactiveSecureLinks, {
        initialRequestId: removeInactiveLinksRequest(),
    });

    return (
        <QuickActionsDropdown iconSize={4} originalPlacement="bottom-end" pill shape="ghost" size="small">
            <DropdownMenuButton
                danger
                loading={loading}
                disabled={inactiveLinkCount === 0 || loading}
                onClick={() => dispatch()}
                label={c('Action').t`Remove all expired links`}
                ellipsis
                icon="trash"
                size="small"
            />
        </QuickActionsDropdown>
    );
};
