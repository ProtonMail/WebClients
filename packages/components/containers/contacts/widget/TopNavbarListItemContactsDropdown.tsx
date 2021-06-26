import React, { useState } from 'react';
import { c } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';

import { Dropdown, DropdownButton, Icon, Tabs, usePopperAnchor } from '../../../components';
import { useModals } from '../../../hooks';
import { generateUID } from '../../../helpers';
import ContactsWidgetContainer from './ContactsWidgetContainer';
import ContactsWidgetGroupsContainer from './ContactsWidgetGroupsContainer';
import ContactsWidgetSettingsContainer from './ContactsWidgetSettingsContainer';
import './ContactsWidget.scss';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../../components/topnavbar/TopNavbarListItemButton';
import ImportModal from '../import/ImportModal';
import { CONTACT_WIDGET_TABS, CustomAction } from './types';

const TopNavbarListItemContactsButton = React.forwardRef(
    (props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>, ref: typeof props.ref) => {
        return (
            <TopNavbarListItemButton
                {...props}
                ref={ref}
                as="button"
                type="button"
                icon={<Icon name="contacts-groups" />}
                text={c('Header').t`Contacts`}
            />
        );
    }
);

interface Props {
    className?: string;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onMailTo?: (src: string) => void;
    customActions?: CustomAction[];
}

const TopNavbarListItemContactsDropdown = ({ className, onCompose, onMailTo, customActions = [] }: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [tabIndex, setTabIndex] = useState(0);
    const { createModal } = useModals();

    const actionIncludes = (tab: CONTACT_WIDGET_TABS) => (customAction: CustomAction) =>
        customAction.tabs.includes(tab);

    const handleClose = () => {
        setTabIndex(0);
        close();
    };

    const handleClickDropdownButton = () => {
        if (isOpen) {
            handleClose();
        } else {
            toggle();
        }
    };

    const handleImport = () => {
        createModal(<ImportModal />);
        handleClose();
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
                originalPlacement="bottom"
                className="contacts-widget"
                contentProps={{
                    className: 'flex-no-min-children flex-column flex-nowrap',
                }}
                noMaxSize
                noMaxWidth
                noMaxHeight
                disableDefaultArrowNavigation
            >
                {/* Translator: this text is "visually"-hidden, it's for helping blind people */}
                <h1 className="sr-only">{c('Header').t`Contacts, groups and settings`}</h1>
                <Tabs
                    className="flex flex-column flex-item-fluid flex-nowrap"
                    containerClassName="contacts-widget-tabs flex-item-noshrink"
                    contentClassNane="flex-item-fluid"
                    tabs={[
                        {
                            title: c('Title').t`Contacts`,
                            content: (
                                <ContactsWidgetContainer
                                    onClose={handleClose}
                                    onCompose={onCompose}
                                    onMailTo={onMailTo}
                                    onImport={handleImport}
                                    customActions={customActions.filter(actionIncludes(CONTACT_WIDGET_TABS.CONTACTS))}
                                />
                            ),
                        },
                        {
                            title: c('Title').t`Groups`,
                            content: (
                                <ContactsWidgetGroupsContainer
                                    onClose={handleClose}
                                    onCompose={onCompose}
                                    customActions={customActions.filter(actionIncludes(CONTACT_WIDGET_TABS.GROUPS))}
                                />
                            ),
                        },
                        {
                            title: c('Title').t`Settings`,
                            content: <ContactsWidgetSettingsContainer onClose={handleClose} onImport={handleImport} />,
                        },
                    ]}
                    value={tabIndex}
                    onChange={setTabIndex}
                />
            </Dropdown>
        </>
    );
};

export default TopNavbarListItemContactsDropdown;
