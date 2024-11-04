import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Icon, useModalState } from '@proton/components';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { selectAliasDetails } from '@proton/pass/store/selectors';
import type { UniqueItem } from '@proton/pass/types';

import { SidebarContactsView } from './SidebarContactsView';
import { SidebarMoreInfoFlow } from './SidebarMoreInfoFlow';

type Props = UniqueItem & {
    aliasEmail: string;
};

export const AliasContact: FC<Props> = ({ aliasEmail, shareId, itemId }) => {
    const [viewContacts, openViewContactSidebar] = useModalState();
    const [moreInfoFlow, openMoreInfoFlowSidebar] = useModalState();
    const aliasDetails = useSelector(selectAliasDetails(aliasEmail));

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
                    <SidebarContactsView
                        onClose={viewContacts.onClose}
                        aliasDetails={aliasDetails}
                        onOpenMoreInfo={() => openMoreInfoFlowSidebar(true)}
                        shareId={shareId}
                        itemId={itemId}
                    />
                    <SidebarMoreInfoFlow {...moreInfoFlow} />
                </>
            )}
        </>
    );
};
