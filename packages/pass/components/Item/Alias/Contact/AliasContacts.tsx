import type { FC } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { AliasContactsProvider } from '@proton/pass/components/Item/Alias/Contact/AliasContactsProvider';
import type { SelectedItem } from '@proton/pass/types';

import { AliasContactsView } from './AliasContactsView';

export const AliasContacts: FC<SelectedItem> = ({ shareId, itemId }) => {
    const [viewContacts, openViewContactSidebar] = useModalState();
    const online = useConnectivity();

    return (
        <AliasContactsProvider shareId={shareId} itemId={itemId}>
            <ValueControl
                actions={<Icon name="chevron-right" size={4} />}
                icon={<Icon name="filing-cabinet" className="mt-0.5" size={4} />}
                onClick={() => openViewContactSidebar(true)}
                value={c('Label').t`Contacts`}
                label=""
                disabled={!online}
            />
            {viewContacts.open && <AliasContactsView onClose={viewContacts.onClose} />}
        </AliasContactsProvider>
    );
};
