import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, useModalState } from '@proton/components';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import type { UniqueItem } from '@proton/pass/types';

import { SidebarContactsView } from './SidebarContactsView';

type Props = UniqueItem;

export const AliasContact: FC<Props> = ({ shareId, itemId }) => {
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
                <>
                    <SidebarContactsView onClose={viewContacts.onClose} shareId={shareId} itemId={itemId} />
                </>
            )}
        </>
    );
};
