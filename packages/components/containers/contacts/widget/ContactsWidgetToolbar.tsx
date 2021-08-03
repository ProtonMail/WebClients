import { ChangeEvent } from 'react';
import { c, msgid } from 'ttag';

import { Checkbox, Icon, Button, Tooltip } from '../../../components';
import { CustomAction } from './types';
import useContactList from '../useContactList';

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
    onClose: () => void;
    customActions: CustomAction[];
    contactList: ReturnType<typeof useContactList>;
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
    customActions,
    contactList,
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

    return (
        <div className="flex flex-items-align-center">
            <Tooltip title={allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}>
                <span className="mr1 flex">
                    <Checkbox
                        id="id_contact-widget-select-all"
                        className="ml0-5"
                        checked={allChecked}
                        onChange={handleCheck}
                        data-testid="contacts:select-all"
                    />
                    <label htmlFor="id_contact-widget-select-all" className="sr-only">
                        {allChecked ? c('Action').t`Deselect all` : c('Action').t`Select all`}
                    </label>
                </span>
            </Tooltip>
            {onCompose ? (
                <>
                    <Tooltip title={c('Action').t`Compose`}>
                        <Button
                            icon
                            className="mr0-5 inline-flex pt0-5 pb0-5"
                            onClick={onCompose}
                            disabled={noEmailInSelected}
                            title={c('Action').t`Compose`}
                            data-testid="contacts:compose"
                        >
                            <Icon name="email" />
                        </Button>
                    </Tooltip>
                    <Tooltip title={c('Action').t`Forward as attachment`}>
                        <Button
                            icon
                            className="mr0-5 inline-flex pt0-5 pb0-5"
                            onClick={onForward}
                            disabled={noEmailInSelected}
                            title={c('Action').t`Forward as attachment`}
                            data-testid="contacts:forward-attachment"
                        >
                            <Icon name="forward" />
                        </Button>
                    </Tooltip>
                </>
            ) : null}
            {customActions.map((action) => action.render({ contactList, noSelection, onClose, selected }))}
            <Tooltip title={c('Action').t`Merge contacts`}>
                <Button
                    icon
                    className="mr0-5 inline-flex pt0-5 pb0-5"
                    onClick={onMerge}
                    disabled={!canMerge}
                    title={c('Action').t`Merge contacts`}
                    data-testid="contacts:merge-contacts"
                >
                    <Icon name="merge" />
                </Button>
            </Tooltip>
            <Tooltip title={deleteText}>
                <Button
                    icon
                    className="inline-flex pt0-5 pb0-5"
                    onClick={onDelete}
                    disabled={noSelection}
                    title={deleteText}
                    data-testid="contacts:delete-contacts"
                >
                    <Icon name="trash" />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Add new contact`}>
                <Button
                    icon
                    color="norm"
                    className="mlauto inline-flex pt0-5 pb0-5"
                    onClick={onCreate}
                    title={c('Action').t`Add new contact`}
                    data-testid="contacts:add-new-contact"
                >
                    <Icon name="contact-add" />
                </Button>
            </Tooltip>
        </div>
    );
};

export default ContactsWidgetToolbar;
