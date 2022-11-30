import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { PrimaryButton } from '@proton/components/components';
import DrawerView, { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { EasySwitchProvider, useContactModals } from '@proton/components/containers';
import { useContactMergeModals } from '@proton/components/containers/contacts/hooks/useContactMergeModals';
import ContactImportModal from '@proton/components/containers/contacts/import/ContactImportModal';
import ContactsWidgetContainer from '@proton/components/containers/contacts/widget/ContactsWidgetContainer';
import ContactsWidgetGroupsContainer from '@proton/components/containers/contacts/widget/ContactsWidgetGroupsContainer';
import ContactsWidgetSettingsContainer from '@proton/components/containers/contacts/widget/ContactsWidgetSettingsContainer';
import { CONTACT_WIDGET_TABS, CustomAction } from '@proton/components/containers/contacts/widget/types';
import { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

enum CONTACT_TAB {
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
    const options: SelectedDrawerOption[] = [
        { text: c('Title').t`Contacts`, value: CONTACT_TAB.CONTACT },
        { text: c('Title').t`Groups`, value: CONTACT_TAB.CONTACT_GROUP },
        { text: c('Title').t`Settings`, value: CONTACT_TAB.SETTINGS },
    ];

    const [tab, setTab] = useState<SelectedDrawerOption>(options[0]);

    const [importModal, onImport] = useModalTwo<void, void>(ContactImportModal, false);
    const { modals: mergeModals, onMerge } = useContactMergeModals();

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
    } = useContactModals({ onMailTo });

    const handleDetails = (contactID: string) => {
        void onDetails(contactID);
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
                        onImport={onImport}
                        onMerge={onMerge}
                        onGroupDetails={onGroupDetails}
                        onGroupEdit={onGroupEdit}
                        onUpgrade={onUpgrade}
                        onSelectEmails={onSelectEmails}
                        isDrawer
                    />
                );
            case CONTACT_TAB.CONTACT_GROUP:
                return (
                    <ContactsWidgetGroupsContainer
                        onCompose={onCompose}
                        onImport={onImport}
                        customActions={customActions.filter(actionIncludes(CONTACT_WIDGET_TABS.GROUPS))}
                        onDetails={onGroupDetails}
                        onEdit={onGroupEdit}
                        onDelete={onGroupDelete}
                        onUpgrade={onUpgrade}
                        isDrawer
                    />
                );
            case CONTACT_TAB.SETTINGS:
                return <ContactsWidgetSettingsContainer onImport={onImport} onExport={onExport} />;
        }
    };

    const getFooterButtons = (tab: CONTACT_TAB) => {
        switch (tab) {
            case CONTACT_TAB.CONTACT:
                return [
                    <PrimaryButton key="footer-button-1" onClick={() => onEdit({})}>{c('Action')
                        .t`Add contact`}</PrimaryButton>,
                    <Button key="footer-button-2" onClick={() => onImport()}>{c('Action').t`Import contacts`}</Button>,
                ];
            case CONTACT_TAB.CONTACT_GROUP:
                return [
                    <PrimaryButton key="footer-button-1" onClick={() => onGroupEdit({})}>{c('Action')
                        .t`Add new group`}</PrimaryButton>,
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
                content={getContent(tab.value as CONTACT_TAB)}
                footerButtons={getFooterButtons(tab.value as CONTACT_TAB)}
            />
            {modals}
            {importModal}
            {mergeModals}
        </EasySwitchProvider>
    );
};

export default DrawerContactView;
