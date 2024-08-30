import type { ReactNode } from 'react';

import type { Recipient, SimpleMap } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type useContactList from '../hooks/useContactList';

export enum CONTACT_WIDGET_TABS {
    CONTACTS,
    GROUPS,
}

export interface CustomActionRenderProps {
    onClose?: () => void;
    noSelection: boolean;
    selected: string[];
    contactList?: ReturnType<typeof useContactList>;
    groupsEmailsMap?: SimpleMap<ContactEmail[]>;
    recipients?: Recipient[];
}

export interface CustomAction {
    render: ({
        onClose,
        noSelection,
        selected,
        contactList,
        groupsEmailsMap,
        recipients,
    }: CustomActionRenderProps) => ReactNode;
    tabs: CONTACT_WIDGET_TABS[];
}
