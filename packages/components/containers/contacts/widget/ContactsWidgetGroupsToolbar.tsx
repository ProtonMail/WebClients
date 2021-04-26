import React, { ChangeEvent } from 'react';
import { c, msgid } from 'ttag';

import { Checkbox, Icon, Button, Tooltip } from '../../../components';

interface Props {
    allChecked: boolean;
    selectedCount: number;
    onCheckAll: (checked: boolean) => void;
    onCompose?: () => void;
    onCreate: () => void;
    onDelete: () => void;
}

const ContactsWidgetGroupsToolbar = ({
    allChecked,
    selectedCount,
    onCheckAll,
    onCompose,
    onCreate,
    onDelete,
}: Props) => {
    const handleCheck = ({ target }: ChangeEvent<HTMLInputElement>) => onCheckAll(target.checked);
    const noSelection = !selectedCount;
    const deleteText = noSelection
        ? c('Action').t`Delete contact group`
        : c('Action').ngettext(
              msgid`Delete ${selectedCount} contact group`,
              `Delete ${selectedCount} contacts groups`,
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
                    />
                    <label htmlFor="id_contact-widget-select-all" className="sr-only">
                        {allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}
                    </label>
                </span>
            </Tooltip>
            {onCompose ? (
                <Tooltip title={c('Action').t`Compose`}>
                    <Button icon className="inline-flex mr0-5 pt0-5 pb0-5" onClick={onCompose} disabled={noSelection}>
                        <Icon name="email" alt={c('Action').t`Compose`} />
                    </Button>
                </Tooltip>
            ) : null}
            <Tooltip>
                <Button
                    icon
                    className="inline-flex pt0-5 pb0-5"
                    onClick={onDelete}
                    disabled={noSelection}
                    title={deleteText}
                >
                    <Icon name="trash" />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Add new group`}>
                <Button icon color="norm" className="mlauto inline-flex pt0-5 pb0-5" onClick={onCreate}>
                    <Icon name="contacts-group-add" alt={c('Action').t`Add new group`} />
                </Button>
            </Tooltip>
        </div>
    );
};

export default ContactsWidgetGroupsToolbar;
