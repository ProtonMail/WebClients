import React, { ChangeEvent } from 'react';
import { c, msgid } from 'ttag';

import { Recipient, SimpleMap } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { Checkbox, Icon, Button, Tooltip } from '../../../components';
import { CustomAction } from './types';

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
    onClose: () => void;
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
        <div className="flex flex-items-align-center">
            <Tooltip title={allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}>
                <span className="mr1 flex">
                    <Checkbox
                        id="id_contact-widget-select-all"
                        className="ml0-5"
                        checked={allChecked}
                        onChange={handleCheck}
                        data-testid="contacts:select-all-contact-group"
                    />
                    <label htmlFor="id_contact-widget-select-all" className="sr-only">
                        {allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}
                    </label>
                </span>
            </Tooltip>
            {onCompose ? (
                <Tooltip title={c('Action').t`Compose`}>
                    <Button
                        icon
                        className="inline-flex mr0-5 pt0-5 pb0-5"
                        onClick={onCompose}
                        disabled={noContactInSelected}
                        data-testid="contacts:compose-contact-group"
                    >
                        <Icon name="email" alt={c('Action').t`Compose`} />
                    </Button>
                </Tooltip>
            ) : null}
            {customActions.map((action) =>
                action.render({ groupsEmailsMap, recipients, noSelection, onClose, selected })
            )}
            <Tooltip>
                <Button
                    icon
                    className="inline-flex pt0-5 pb0-5"
                    onClick={onDelete}
                    disabled={noSelection}
                    title={deleteText}
                    data-testid="contacts:delete-contact-group"
                >
                    <Icon name="trash" />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Add new group`}>
                <Button
                    icon
                    color="norm"
                    className="mlauto inline-flex pt0-5 pb0-5"
                    onClick={onCreate}
                    data-testid="contacts:add-contact-group"
                >
                    <Icon name="contacts-group-add" alt={c('Action').t`Add new group`} />
                </Button>
            </Tooltip>
        </div>
    );
};

export default ContactsWidgetGroupsToolbar;
