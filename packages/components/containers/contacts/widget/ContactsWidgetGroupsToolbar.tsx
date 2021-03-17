import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { Button, Checkbox, Tooltip } from '../../../components';

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
            <Tooltip className="mr1 flex" title={allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}>
                <Checkbox
                    id="id_contact-widget-select-all"
                    className="ml0-5"
                    checked={allChecked}
                    onChange={handleCheck}
                />
                <label htmlFor="id_contact-widget-select-all" className="sr-only">
                    {allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}
                </label>
            </Tooltip>
            <Tooltip className="mr0-5" title={c('Action').t`Compose`}>
                <Button
                    className="button--for-icon inline-flex pt0-5 pb0-5"
                    icon="email"
                    onClick={onCompose}
                    disabled={!oneSelected}
                >
                    <span className="sr-only">{c('Action').t`Compose`}</span>
                </Button>
            </Tooltip>
            <Tooltip className="mlauto" title={c('Action').t`Add new group`}>
                <Button
                    className="button--for-icon button--primary inline-flex pt0-5 pb0-5"
                    icon="contacts-group-add"
                    onClick={onCreate}
                >
                    <span className="sr-only">{c('Action').t`Add new contact`}</span>
                </Button>
            </Tooltip>
        </div>
    );
};

export default ContactsWidgetGroupsToolbar;
