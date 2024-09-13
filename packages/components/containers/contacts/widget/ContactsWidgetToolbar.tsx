import type { ChangeEvent } from 'react';
import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import isTruthy from '@proton/utils/isTruthy';

import { ButtonGroup, Checkbox, Tooltip } from '../../../components';
import ContactGroupDropdown from '../ContactGroupDropdown';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import type useContactList from '../hooks/useContactList';
import type { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import type { SelectEmailsProps } from '../modals/SelectEmailsModal';
import type { CustomAction } from './types';

interface Props {
    allChecked: boolean;
    selected: string[];
    noEmailsContactCount: number;
    onCheckAll: (checked: boolean) => void;
    onCompose?: () => void;
    onForward: () => void;
    onDelete: () => void;
    onCreate: () => void;
    onMerge: () => void;
    onClose?: () => void;
    onLock?: (lock: boolean) => void;
    customActions: CustomAction[];
    contactList: ReturnType<typeof useContactList>;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onLimitReached: (props: ContactGroupLimitReachedProps) => void;
    onUpgrade: () => void;
    onSelectEmails: (props: SelectEmailsProps) => Promise<ContactEmail[]>;
    isDrawer?: boolean;
}

const ContactsWidgetToolbar = ({
    allChecked,
    selected,
    noEmailsContactCount,
    onCheckAll,
    onCompose,
    onForward,
    onDelete,
    onCreate,
    onMerge,
    onClose,
    onLock,
    customActions,
    contactList,
    onGroupEdit,
    onLimitReached,
    onUpgrade,
    onSelectEmails,
    isDrawer = false,
}: Props) => {
    const selectedCount = selected.length;
    const handleCheck = ({ target }: ChangeEvent<HTMLInputElement>) => onCheckAll(target.checked);
    const noEmailInSelected = noEmailsContactCount === selectedCount;
    const noSelection = !selectedCount;
    const canMerge = selectedCount > 1;
    const deleteText = noSelection
        ? c('Action').t`Delete contact`
        : // translator: the variable is a positive integer (written in digits) always greater or equal to 1
          c('Action').ngettext(
              msgid`Delete ${selectedCount} contact`,
              `Delete ${selectedCount} contacts`,
              selectedCount
          );

    const contactEmails = useMemo(() => {
        return selected.flatMap((contactID) => contactList.contactEmailsMap[contactID]).filter(isTruthy);
    }, [selected, contactList.contactEmailsMap]);

    return (
        <div className="flex">
            <Tooltip title={allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}>
                <span className="mr-4 flex">
                    <Checkbox
                        id="id_contact-widget-select-all"
                        checked={allChecked}
                        onChange={handleCheck}
                        data-testid="contacts:select-all"
                    />
                    <label htmlFor="id_contact-widget-select-all" className="sr-only">
                        {allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}
                    </label>
                </span>
            </Tooltip>
            <ButtonGroup>
                {onCompose && (
                    <Tooltip title={c('Action').t`Compose`}>
                        <Button
                            icon
                            className="inline-flex"
                            onClick={onCompose}
                            disabled={noEmailInSelected}
                            title={c('Action').t`Compose`}
                            data-testid="contacts:compose"
                        >
                            <Icon name="pen-square" alt={c('Action').t`Compose`} />
                        </Button>
                    </Tooltip>
                )}
                {onCompose && (
                    <Tooltip title={c('Action').t`Forward as attachment`}>
                        <Button
                            icon
                            className="inline-flex"
                            onClick={onForward}
                            disabled={noSelection}
                            title={c('Action').t`Forward as attachment`}
                            data-testid="contacts:forward-attachment"
                        >
                            <Icon name="arrow-right" alt={c('Action').t`Forward as attachment`} />
                        </Button>
                    </Tooltip>
                )}
                {customActions.map((action) => action.render({ contactList, noSelection, onClose, selected }))}
                <Tooltip title={c('Action').t`Merge contacts`}>
                    <Button
                        icon
                        className="inline-flex"
                        onClick={onMerge}
                        disabled={!canMerge}
                        title={c('Action').t`Merge contacts`}
                        data-testid="contacts:merge-contacts"
                    >
                        <Icon name="users-merge" alt={c('Action').t`Merge contacts`} />
                    </Button>
                </Tooltip>
                <ContactGroupDropdown
                    className="inline-flex"
                    contactEmails={contactEmails}
                    disabled={contactEmails.length === 0}
                    forToolbar
                    onLock={onLock}
                    onSuccess={() => onCheckAll(false)}
                    onGroupEdit={onGroupEdit}
                    onLimitReached={onLimitReached}
                    onUpgrade={onUpgrade}
                    onSelectEmails={onSelectEmails}
                >
                    <Icon name="users" />
                </ContactGroupDropdown>
                <Tooltip title={deleteText}>
                    <Button
                        icon
                        className="inline-flex"
                        onClick={onDelete}
                        disabled={noSelection}
                        title={deleteText}
                        data-testid="contacts:delete-contacts"
                    >
                        <Icon name="trash" />
                    </Button>
                </Tooltip>
                {!isDrawer && (
                    <Tooltip title={c('Action').t`Add new contact`}>
                        <Button
                            icon
                            color="norm"
                            className="ml-auto inline-flex"
                            onClick={onCreate}
                            title={c('Action').t`Add new contact`}
                            data-testid="contacts:add-new-contact"
                        >
                            <Icon name="user-plus" />
                        </Button>
                    </Tooltip>
                )}
            </ButtonGroup>
        </div>
    );
};

export default ContactsWidgetToolbar;
