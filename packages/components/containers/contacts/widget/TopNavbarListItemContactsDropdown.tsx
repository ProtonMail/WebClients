import { forwardRef, useState } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownButton, Icon, Tabs, usePopperAnchor } from '@proton/components';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '@proton/components/components/topnavbar/TopNavbarListItemButton';
import { generateUID } from '@proton/components/helpers';
import { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useModalTwo } from '../../../components/modalTwo/useModalTwo';
import { useContactMergeModals } from '../hooks/useContactMergeModals';
import { useContactModals } from '../hooks/useContactModals';
import ContactImportModal from '../import/ContactImportModal';
import ContactsWidgetContainer from './ContactsWidgetContainer';
import ContactsWidgetGroupsContainer from './ContactsWidgetGroupsContainer';
import ContactsWidgetSettingsContainer from './ContactsWidgetSettingsContainer';
import { CONTACT_WIDGET_TABS, CustomAction } from './types';

import './ContactsWidget.scss';

const TopNavbarListItemContactsButton = forwardRef(
    (props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>, ref: typeof props.ref) => {
        return (
            <TopNavbarListItemButton
                {...props}
                ref={ref}
                as="button"
                type="button"
                icon={<Icon name="users" />}
                text={c('Header').t`Contacts`}
            />
        );
    }
);
TopNavbarListItemContactsButton.displayName = 'TopNavbarListItemContactsButton';

interface Props {
    className?: string;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onMailTo?: (src: string) => void;
    customActions?: CustomAction[];
}

const TopNavbarListItemContactsDropdown = ({ className, onCompose, onMailTo = noop, customActions = [] }: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [tabIndex, setTabIndex] = useState(0);
    const [lock, setLock] = useState(false);

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
    const [importModal, onImport] = useModalTwo<void, void>(ContactImportModal, false);
    const { modals: mergeModals, onMerge } = useContactMergeModals();

    const actionIncludes = (tab: CONTACT_WIDGET_TABS) => (customAction: CustomAction) =>
        customAction.tabs.includes(tab);

    const handleClose = () => {
        setTabIndex(0);
        close();
    };

    const handleDetails = (contactID: string) => {
        void onDetails(contactID);
        handleClose();
    };

    const handleClickDropdownButton = () => {
        if (isOpen) {
            handleClose();
        } else {
            toggle();
        }
    };

    return (
        <>
            <DropdownButton
                as={TopNavbarListItemContactsButton}
                isOpen={isOpen}
                className={className}
                ref={anchorRef}
                onClick={handleClickDropdownButton}
                title={c('Title').t`View contacts`}
            >
                <></>
            </DropdownButton>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={handleClose}
                autoClose={false}
                autoCloseOutside={!lock}
                originalPlacement="bottom"
                className="contacts-widget"
                contentProps={{
                    className: 'flex-no-min-children flex-column flex-nowrap',
                }}
                noMaxSize
                noMaxWidth
                noMaxHeight
                disableDefaultArrowNavigation
                updatePositionOnDOMChange={false}
            >
                {/* Translator: this text is "visually"-hidden, it's for helping blind people */}
                <h1 className="sr-only">{c('Header').t`Contacts, groups and settings`}</h1>
                <Tabs
                    className="flex flex-column flex-item-fluid flex-nowrap"
                    containerClassName="contacts-widget-tabs flex-item-noshrink"
                    contentClassName="flex-item-fluid"
                    tabs={[
                        {
                            title: c('Title').t`Contacts`,
                            content: (
                                <ContactsWidgetContainer
                                    onClose={handleClose}
                                    onCompose={onCompose}
                                    onLock={setLock}
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
                                />
                            ),
                        },
                        {
                            title: c('Title').t`Groups`,
                            content: (
                                <ContactsWidgetGroupsContainer
                                    onClose={handleClose}
                                    onCompose={onCompose}
                                    onImport={onImport}
                                    customActions={customActions.filter(actionIncludes(CONTACT_WIDGET_TABS.GROUPS))}
                                    onDetails={onGroupDetails}
                                    onEdit={onGroupEdit}
                                    onDelete={onGroupDelete}
                                    onUpgrade={onUpgrade}
                                />
                            ),
                        },
                        {
                            title: c('Title').t`Settings`,
                            content: (
                                <ContactsWidgetSettingsContainer
                                    onImport={onImport}
                                    onExport={onExport}
                                    onClose={handleClose}
                                />
                            ),
                        },
                    ]}
                    value={tabIndex}
                    onChange={setTabIndex}
                />
            </Dropdown>
            {modals}
            {importModal}
            {mergeModals}
        </>
    );
};

export default TopNavbarListItemContactsDropdown;
