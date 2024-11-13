import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, useModalState } from '@proton/components';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { AliasContactsProvider } from '@proton/pass/components/Item/Alias/Contact/AliasContactsProvider';

import { SidebarContactsView } from './SidebarContactsView';

export const AliasContact: FC = () => {
    const [viewContacts, openViewContactSidebar] = useModalState();

    return (
        <>
            <ValueControl
                actions={<Icon name="chevron-right" size={4} />}
                icon={<Icon name="filing-cabinet" className="mt-0.5" size={4} />}
                onClick={() => openViewContactSidebar(true)}
                value={c('Label').t`Contacts`}
                label=""
            />
            {viewContacts.open && (
                <AliasContactsProvider>
                    <SidebarContactsView onClose={viewContacts.onClose} />
                </AliasContactsProvider>
            )}
        </>
    );
};
