import type { FC } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcFilingCabinet } from '@proton/icons/icons/IcFilingCabinet';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { AliasContactsProvider } from '@proton/pass/components/Item/Alias/Contact/AliasContactsProvider';
import type { SelectedItem } from '@proton/pass/types';

import { AliasContactsView } from './AliasContactsView';

export const AliasContacts: FC<SelectedItem> = ({ shareId, itemId }) => {
    const [viewContacts, openViewContactSidebar] = useModalState();
    const online = useOnline();

    return (
        <AliasContactsProvider shareId={shareId} itemId={itemId}>
            <ValueControl
                actions={<IcChevronRight size={4} />}
                icon={<IcFilingCabinet className="mt-0.5" size={4} />}
                onClick={() => openViewContactSidebar(true)}
                value={c('Label').t`Contacts`}
                label=""
                disabled={!online}
            />
            {viewContacts.open && <AliasContactsView onClose={viewContacts.onClose} />}
        </AliasContactsProvider>
    );
};
