import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { EasySwitchProvider } from '@proton/activation';
import { Button } from '@proton/atoms';
import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DrawerView from '@proton/components/components/drawer/views/DrawerView';
import { CONTACT_TAB } from '@proton/components/components/drawer/views/interface';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import { useContactMergeModals } from '@proton/components/containers/contacts/hooks/useContactMergeModals';
import { useContactModals } from '@proton/components/containers/contacts/hooks/useContactModals';
import ContactImportModal from '@proton/components/containers/contacts/import/ContactImportModal';
import ContactsTabImportDropdown from '@proton/components/containers/contacts/widget/ContactsTabImportDropdown';
import ContactsWidgetContainer from '@proton/components/containers/contacts/widget/ContactsWidgetContainer';
import ContactsWidgetGroupsContainer from '@proton/components/containers/contacts/widget/ContactsWidgetGroupsContainer';
import type { CustomAction } from '@proton/components/containers/contacts/widget/types';
import { CONTACT_WIDGET_TABS } from '@proton/components/containers/contacts/widget/types';
import useDrawerContactFocus from '@proton/components/hooks/useDrawerContactFocus';
import useContactsDrawerFromURL from '@proton/mail/hooks/autoOpenContacts/useContactsDrawerFromURL';
import type { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

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

    useContactsDrawerFromURL({ onEdit, onGroupEdit, onSelectGroupTab: () => setTab(options[1]) });

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
        const tabContent = () => {
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
                            searchInputRef={searchInputRef}
                            onExport={onExport}
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
                        />
                    );
            }
        };

        return (
            <div
                id={`content-tab-${tab}`}
                role="tabpanel"
                aria-labelledby={`header-tab-${tab}`}
                className="flex flex-1 h-full w-full pt-3"
            >
                {tabContent()}
            </div>
        );
    };

    const getFooterButtons = (tab: CONTACT_TAB) => {
        switch (tab) {
            case CONTACT_TAB.CONTACT:
                return [
                    <Button
                        color="norm"
                        data-testid="contacts:add-contact"
                        key="contact-footer-button-1"
                        onClick={() => onEdit({})}
                    >{c('Action').t`Add contact`}</Button>,
                    <ContactsTabImportDropdown onImport={onOpenImportModal} />,
                ];
            case CONTACT_TAB.CONTACT_GROUP:
                return [
                    <Button
                        color="norm"
                        data-testid="groups:add-group"
                        key="contact-footer-button-3"
                        onClick={() => handleAddContactGroup()}
                    >{c('Action').t`Add new group`}</Button>,
                ];
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
                isUsingTabs
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
