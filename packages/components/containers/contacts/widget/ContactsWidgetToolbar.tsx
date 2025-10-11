import type { ChangeEvent } from 'react';
import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import isTruthy from '@proton/utils/isTruthy';

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
    onExport: () => void;
    onDelete: () => void;
    onMerge: () => void;
    onClose?: () => void;
    onLock?: (lock: boolean) => void;
    customActions: CustomAction[];
    contactList: ReturnType<typeof useContactList>;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onLimitReached: (props: ContactGroupLimitReachedProps) => void;
    onUpgrade: () => void;
    onSelectEmails: (props: SelectEmailsProps) => Promise<ContactEmail[]>;
}

const ContactsWidgetToolbar = ({
    allChecked,
    selected,
    noEmailsContactCount,
    onCheckAll,
    onCompose,
    onForward,
    onExport,
    onDelete,
    onMerge,
    onClose,
    onLock,
    customActions,
    contactList,
    onGroupEdit,
    onLimitReached,
    onUpgrade,
    onSelectEmails,
}: Props) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

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
                <span className="mr-3 flex">
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
            <div className="border-left border-weak flex flex-row flex-nowrap pl-2 gap-1">
                {onCompose && (
                    <Tooltip title={c('Action').t`Compose`}>
                        <Button
                            icon
                            size="small"
                            shape="ghost"
                            className="inline-flex"
                            onClick={onCompose}
                            disabled={noEmailInSelected}
                            title={c('Action').t`Compose`}
                            data-testid="contacts:compose"
                        >
                            <Icon name="envelope" alt={c('Action').t`Compose`} />
                        </Button>
                    </Tooltip>
                )}
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
                    shape="ghost"
                    size="small"
                    icon
                >
                    <Icon name="users" alt={c('Action').t`Add to group`} />
                </ContactGroupDropdown>
                {customActions.map((action) => action.render({ contactList, noSelection, onClose, selected }))}
                <Tooltip title={deleteText}>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        className="inline-flex"
                        onClick={onDelete}
                        disabled={noSelection}
                        title={deleteText}
                        data-testid="contacts:delete-contacts"
                    >
                        <Icon name="trash" alt={deleteText} />
                    </Button>
                </Tooltip>
                <>
                    <Tooltip title={c('Action').t`More actions`}>
                        <DropdownButton
                            icon
                            shape="ghost"
                            size="small"
                            className="inline-flex"
                            onClick={toggle}
                            disabled={noSelection}
                            title={c('Action').t`More actions`}
                            data-testid="contacts:more-actions"
                            ref={anchorRef}
                            aria-expanded={isOpen}
                        >
                            <Icon name="three-dots-horizontal" alt={c('Action').t`More actions`} />
                        </DropdownButton>
                    </Tooltip>
                    <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                        <DropdownMenu>
                            <DropdownMenuButton
                                className="text-left flex flex-nowrap items-center"
                                onClick={onMerge}
                                data-testid="contacts:merge-contacts"
                                title={c('Action').t`Merge contacts`}
                                disabled={!canMerge}
                            >
                                <Icon name="users-merge" className="mr-2" alt={c('Action').t`Merge contacts`} />
                                <span className="flex-1 my-auto">{c('Action').t`Merge contacts`}</span>
                            </DropdownMenuButton>
                            <div className="dropdown-item-hr" key="hr-1" />
                            {onCompose && (
                                <>
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={onForward}
                                        data-testid="contacts:forward-attachment"
                                        title={c('Action').t`Forward as attachment`}
                                        disabled={noSelection}
                                    >
                                        <Icon
                                            name="arrow-up-and-right-big"
                                            className="mr-2"
                                            alt={c('Action').t`Forward as attachment`}
                                        />
                                        <span className="flex-1 my-auto">{c('Action').t`Forward as attachment`}</span>
                                    </DropdownMenuButton>
                                    <div className="dropdown-item-hr" key="hr-1" />
                                </>
                            )}
                            <DropdownMenuButton
                                className="text-left flex flex-nowrap items-center"
                                onClick={onExport}
                                data-testid="contacts:export-selection"
                                title={c('Action').t`Export selection as .vcf`}
                                disabled={noSelection}
                            >
                                <Icon
                                    name="arrow-up-from-square"
                                    className="mr-2"
                                    alt={c('Action').t`Export selection as .vcf`}
                                />
                                <span className="flex-1 my-auto">{c('Action').t`Export selection as .vcf`}</span>
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </Dropdown>
                </>
            </div>
        </div>
    );
};

export default ContactsWidgetToolbar;
