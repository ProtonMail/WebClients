import type { ChangeEvent } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { Recipient, SimpleMap } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { ButtonGroup, Checkbox, Tooltip } from '../../../components';
import type { CustomAction } from './types';

interface Props {
    allChecked: boolean;
    selected: string[];
    numberOfRecipients: number;
    onCheckAll: (checked: boolean) => void;
    onCompose?: () => void;
    onCreate: () => void;
    onDelete: () => void;
    customActions: CustomAction[];
    groupsEmailsMap: SimpleMap<ContactEmail[]>;
    recipients: Recipient[];
    onClose?: () => void;
    isDrawer?: boolean;
}

const ContactsWidgetGroupsToolbar = ({
    allChecked,
    selected,
    numberOfRecipients,
    onCheckAll,
    onCompose,
    onCreate,
    onDelete,
    customActions,
    groupsEmailsMap,
    recipients,
    onClose,
    isDrawer = false,
}: Props) => {
    const selectedCount = selected.length;
    const handleCheck = ({ target }: ChangeEvent<HTMLInputElement>) => onCheckAll(target.checked);
    const noContactInSelected = !selectedCount || !numberOfRecipients;
    const noSelection = !selectedCount;
    const deleteText = noSelection
        ? c('Action').t`Delete contact group`
        : // translator: the variable is a positive integer (written in digits) always greater or equal to 1
          c('Action').ngettext(
              msgid`Delete ${selectedCount} contact group`,
              `Delete ${selectedCount} contact groups`,
              selectedCount
          );

    return (
        <div className="flex">
            <Tooltip title={allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}>
                <span className="mr-4 flex">
                    <Checkbox
                        id="id_contact-widget-select-all"
                        checked={allChecked}
                        onChange={handleCheck}
                        data-testid="contacts:select-all-contact-group"
                    />
                    <label htmlFor="id_contact-widget-select-all" className="sr-only">
                        {allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}
                    </label>
                </span>
            </Tooltip>
            <ButtonGroup>
                {onCompose ? (
                    <Tooltip title={c('Action').t`Compose`}>
                        <Button
                            icon
                            className="inline-flex"
                            onClick={onCompose}
                            disabled={noContactInSelected}
                            data-testid="contacts:compose-contact-group"
                        >
                            <Icon name="pen-square" alt={c('Action').t`Compose`} />
                        </Button>
                    </Tooltip>
                ) : null}
                {customActions.map((action) =>
                    action.render({ groupsEmailsMap, recipients, noSelection, onClose, selected })
                )}
                <Tooltip title={deleteText}>
                    <Button
                        icon
                        className="inline-flex"
                        onClick={onDelete}
                        disabled={noSelection}
                        data-testid="contacts:delete-contact-group"
                    >
                        <Icon name="trash" />
                    </Button>
                </Tooltip>
                {!isDrawer && (
                    <Tooltip title={c('Action').t`Add new group`}>
                        <Button
                            icon
                            color="norm"
                            className="ml-auto inline-flex"
                            onClick={onCreate}
                            data-testid="contacts:add-contact-group"
                        >
                            <Icon name="users-plus" alt={c('Action').t`Add new group`} />
                        </Button>
                    </Tooltip>
                )}
            </ButtonGroup>
        </div>
    );
};

export default ContactsWidgetGroupsToolbar;
