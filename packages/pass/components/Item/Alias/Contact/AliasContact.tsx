import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, useModalState } from '@proton/components';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import type { UniqueItem } from '@proton/pass/types';

import { SidebarContactsView } from './SidebarContactsView';

type Props = UniqueItem;

export const AliasContact: FC<Props> = ({ shareId, itemId }) => {
    const [viewContacts, openViewContactSidebar] = useModalState();

    return (
        <>
            <FieldBox
                className="py-4 cursor-pointer"
                actions={<Icon name="chevron-right" size={4} />}
                icon={<Icon name="filing-cabinet" size={5} />}
                onClick={() => openViewContactSidebar(true)}
            >
                <div>{c('Label').t`Contacts`}</div>
            </FieldBox>
            {viewContacts.open && (
                <>
                    <SidebarContactsView onClose={viewContacts.onClose} shareId={shareId} itemId={itemId} />
                </>
            )}
        </>
    );
};
