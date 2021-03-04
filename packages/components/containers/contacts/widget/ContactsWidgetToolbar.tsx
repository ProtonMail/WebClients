import React, { ChangeEvent } from 'react';
import { c, msgid } from 'ttag';
import { Button, Checkbox, Tooltip } from '../../../components';

interface Props {
    allChecked: boolean;
    selectedCount: number;
    onCheckAll: (checked: boolean) => void;
    onCompose: () => void;
    onForward: () => void;
    onDelete: () => void;
    onCreate: () => void;
}

const ContactsWidgetToolbar = ({
    allChecked,
    selectedCount,
    onCheckAll,
    onCompose,
    onForward,
    onDelete,
    onCreate,
}: Props) => {
    const handleCheck = ({ target }: ChangeEvent<HTMLInputElement>) => onCheckAll(target.checked);
    const noSelection = !selectedCount;
    const deleteText = noSelection
        ? c('Action').t`Delete contact`
        : c('Action').ngettext(
              msgid`Delete ${selectedCount} contact`,
              `Delete ${selectedCount} contacts`,
              selectedCount
          );

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
                    disabled={noSelection}
                >
                    <span className="sr-only">{c('Action').t`Compose`}</span>
                </Button>
            </Tooltip>
            <Tooltip className="mr0-5" title={c('Action').t`Forward as attachment`}>
                <Button
                    className="button--for-icon inline-flex pt0-5 pb0-5"
                    icon="forward"
                    onClick={onForward}
                    disabled={noSelection}
                >
                    <span className="sr-only">{c('Action').t`Forward as attachment`}</span>
                </Button>
            </Tooltip>
            <Tooltip title={deleteText}>
                <Button
                    className="button--for-icon inline-flex pt0-5 pb0-5"
                    icon="trash"
                    onClick={onDelete}
                    disabled={noSelection}
                >
                    <span className="sr-only">{deleteText}</span>
                </Button>
            </Tooltip>
            <Tooltip className="mlauto" title={c('Action').t`Add new contact`}>
                <Button
                    className="button--for-icon button--primary inline-flex pt0-5 pb0-5"
                    icon="contact-add"
                    onClick={onCreate}
                >
                    <span className="sr-only">{c('Action').t`Add new contact`}</span>
                </Button>
            </Tooltip>
        </div>
    );
};

export default ContactsWidgetToolbar;
