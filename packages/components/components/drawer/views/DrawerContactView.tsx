import { useRef, useState } from 'react';

import { c } from 'ttag';

import { EasySwitchProvider } from '@proton/activation';
import { Button } from '@proton/atoms';
import { useModalTwoStatic } from '@proton/components/components';
import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DrawerView from '@proton/components/components/drawer/views/DrawerView';
import { useContactModals } from '@proton/components/containers';
import { useContactMergeModals } from '@proton/components/containers/contacts/hooks/useContactMergeModals';
import ContactImportModal from '@proton/components/containers/contacts/import/ContactImportModal';
import ContactsWidgetContainer from '@proton/components/containers/contacts/widget/ContactsWidgetContainer';
import ContactsWidgetGroupsContainer from '@proton/components/containers/contacts/widget/ContactsWidgetGroupsContainer';
import ContactsWidgetSettingsContainer from '@proton/components/containers/contacts/widget/ContactsWidgetSettingsContainer';
import type { CustomAction } from '@proton/components/containers/contacts/widget/types';
import { CONTACT_WIDGET_TABS } from '@proton/components/containers/contacts/widget/types';
import { useUser } from '@proton/components/hooks';
import useDrawerContactFocus from '@proton/components/hooks/useDrawerContactFocus';
import type { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

export enum CONTACT_TAB {
    CONTACT = 'contact',
    CONTACT_GROUP = 'contact-group',
    SETTINGS = 'settings',
}

interface Props {
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onMailTo?: (src: string) => void;
    customActions?: CustomAction[];
}

const DrawerContactView = ({ onCompose, onMailTo = noop, customActions = [] }: Props) => {
    const [{ hasPaidMail }] = useUser();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const options: SelectedDrawerOption[] = [
        { text: c('Title').t`Contacts`, value: CONTACT_TAB.CONTACT },
        { text: c('Title').t`Groups`, value: CONTACT_TAB.CONTACT_GROUP },
        { text: c('Title').t`Settings`, value: CONTACT_TAB.SETTINGS },
    ];

    const [tab, setTab] = useState<SelectedDrawerOption>(options[0]);

    const [importModal, onImport] = useModalTwoStatic(ContactImportModal);
    const onOpenImportModal = () => onImport({});
    const { modals: mergeModals, onMerge } = useContactMergeModals();

    const { onFocusSearchInput } = useDrawerContactFocus(searchInputRef, tab);

    const {
        modals,
        onDetails,
        onEdit,
        onDelete,
        onExport,
        onGroupDetails,
        onGroupEdit,
        onGroupDelete,
        onUpgrade,
        onSelectEmails,
        onLimitReached,
    } = useContactModals({ onMailTo, onCompose });

    const handleDetails = (contactID: string) => {
        void onDetails(contactID);
    };

    const handleAddContactGroup = () => {
        if (hasPaidMail) {
            onGroupEdit({});
        } else {
            onUpgrade();
        }
    };

    const actionIncludes = (tab: CONTACT_WIDGET_TABS) => (customAction: CustomAction) =>
        customAction.tabs.includes(tab);

    const getContent = (tab: CONTACT_TAB) => {
        switch (tab) {
            case CONTACT_TAB.CONTACT:
                return (
                    <ContactsWidgetContainer
                        onCompose={onCompose}
                        customActions={customActions.filter(actionIncludes(CONTACT_WIDGET_TABS.CONTACTS))}
                        onDetails={handleDetails}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onImport={onOpenImportModal}
                        onMerge={onMerge}
                        onGroupDetails={onGroupDetails}
                        onGroupEdit={onGroupEdit}
                        onUpgrade={onUpgrade}
                        onSelectEmails={onSelectEmails}
                        onLimitReached={onLimitReached}
                        isDrawer
                        searchInputRef={searchInputRef}
                    />
                );
            case CONTACT_TAB.CONTACT_GROUP:
                return (
                    <ContactsWidgetGroupsContainer
                        onCompose={onCompose}
                        onImport={onOpenImportModal}
                        customActions={customActions.filter(actionIncludes(CONTACT_WIDGET_TABS.GROUPS))}
                        onDetails={onGroupDetails}
                        onEdit={onGroupEdit}
                        onDelete={onGroupDelete}
                        onUpgrade={onUpgrade}
                        isDrawer
                    />
                );
            case CONTACT_TAB.SETTINGS:
                return <ContactsWidgetSettingsContainer onImport={onOpenImportModal} onExport={onExport} />;
        }
    };

    const getFooterButtons = (tab: CONTACT_TAB) => {
        switch (tab) {
            case CONTACT_TAB.CONTACT:
                return [
                    <PrimaryButton
                        data-testid="contacts:add-contact"
                        key="footer-button-1"
                        onClick={() => onEdit({})}
                    >{c('Action').t`Add contact`}</PrimaryButton>,
                    <Button key="footer-button-2" onClick={onOpenImportModal}>{c('Action').t`Import contacts`}</Button>,
                ];
            case CONTACT_TAB.CONTACT_GROUP:
                return [
                    <PrimaryButton
                        data-testid="groups:add-group"
                        key="footer-button-1"
                        onClick={() => handleAddContactGroup()}
                    >{c('Action').t`Add new group`}</PrimaryButton>,
                ];
            case CONTACT_TAB.SETTINGS:
                return undefined;
        }
    };

    return (
        <EasySwitchProvider>
            <DrawerView
                tab={tab}
                onSelectDrawerOption={setTab}
                options={options}
                footerButtons={getFooterButtons(tab.value as CONTACT_TAB)}
                onAnimationEnd={onFocusSearchInput}
                id="drawer-app-proton-contact"
            >
                {getContent(tab.value as CONTACT_TAB)}
            </DrawerView>
            {modals}
            {importModal}
            {mergeModals}
        </EasySwitchProvider>
    );
};

export default DrawerContactView;
