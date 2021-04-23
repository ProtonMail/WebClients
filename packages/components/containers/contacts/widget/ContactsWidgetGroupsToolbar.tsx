import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { Checkbox, Icon, Button, Tooltip } from '../../../components';

interface Props {
    allChecked: boolean;
    oneSelected: boolean;
    onCheckAll: (checked: boolean) => void;
    onCompose: () => void;
    onCreate: () => void;
}

const ContactsWidgetGroupsToolbar = ({ allChecked, oneSelected, onCheckAll, onCompose, onCreate }: Props) => {
    const handleCheck = ({ target }: ChangeEvent<HTMLInputElement>) => onCheckAll(target.checked);

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
            <Tooltip title={c('Action').t`Compose`}>
                <Button icon className="inline-flex mr0-5 pt0-5 pb0-5" onClick={onCompose} disabled={!oneSelected}>
                    <Icon name="email" alt={c('Action').t`Compose`} />
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
