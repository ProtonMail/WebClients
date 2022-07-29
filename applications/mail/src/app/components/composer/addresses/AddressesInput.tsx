import { Fragment, MouseEvent, MutableRefObject, RefObject, useEffect, useRef, useState } from 'react';
import * as React from 'react';

import { c, msgid } from 'ttag';

import {
    AddressesAutocomplete,
    Button,
    Icon,
    Tooltip,
    classnames,
    useContactEmails,
    useContactGroups,
    useNotifications,
} from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import noop from '@proton/utils/noop';

import { getRecipientOrGroupKey, recipientsWithoutGroup } from '../../../helpers/addresses';
import { useContactsMap, useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useAddressesInputDrag } from '../../../hooks/useAddressesInputDrag';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { RecipientGroup } from '../../../models/address';
import AddressesGroupItem from './AddressesGroupItem';
import AddressesRecipientItem from './AddressesRecipientItem';

interface Props {
    id: string;
    recipients?: Recipient[];
    messageSendInfo?: MessageSendInfo;
    onChange: (value: Recipient[]) => void;
    inputFocusRef?: MutableRefObject<() => void>;
    placeholder?: string;
    expanded?: boolean;
    dataTestId?: string;
    addContactButton?: string;
    addContactAction?: () => void;
    classname?: string;
    hasLighterFieldDesign?: boolean;
    anchorRef: RefObject<HTMLElement>;
}

const AddressesInput = ({
    id,
    recipients = [],
    messageSendInfo,
    onChange,
    inputFocusRef,
    placeholder,
    expanded = false,
    dataTestId,
    addContactButton,
    addContactAction,
    classname,
    hasLighterFieldDesign = false,
    anchorRef,
}: Props) => {
    const contactEmailsMap = useContactsMap();
    const groupsWithContactsMap = useGroupsWithContactsMap();

    const { getRecipientsOrGroups } = useRecipientLabel();
    const [contactEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];
    const [contactGroups] = useContactGroups();

    const { createNotification } = useNotifications();

    const inputRef = useRef<HTMLInputElement>(null);

    const [recipientsOrGroups, setRecipientsOrGroups] = useState(() => getRecipientsOrGroups(recipients));

    useEffect(() => setRecipientsOrGroups(getRecipientsOrGroups(recipients)), [recipients]);

    useEffect(() => {
        if (inputFocusRef) {
            inputFocusRef.current = inputRef.current?.focus.bind(inputRef.current) || noop;
        }
    }, []);

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        inputRef.current?.focus();
    };

    const isNonEmptyRecipient = ({ Address }: Recipient) => {
        return Address.trim();
    };

    const showDuplicateNotif = (addresses: string[]) => {
        const recipents = addresses.length > 1 ? addresses.join(', ') : addresses[0];

        const text = c('Error').ngettext(
            msgid`Removed duplicate recipient: ${recipents}`,
            `Removed duplicate recipients: ${recipents}`,
            addresses.length
        );

        createNotification({
            text,
            type: 'warning',
        });
    };

    const handleAddRecipient = (newRecipients: Recipient[]) => {
        const filteredRecipients = newRecipients.filter(isNonEmptyRecipient);

        const duplicates: Recipient[] = [];

        const dedupRecipients = filteredRecipients.reduce<Recipient[]>((acc, recipient) => {
            if (recipients.some(({ Address }) => Address === recipient.Address)) {
                duplicates.push(recipient);
                return acc;
            }

            return [...acc, recipient];
        }, []);

        if (duplicates.length) {
            showDuplicateNotif(duplicates.map(({ Address }) => Address));
        }

        if (!dedupRecipients.length) {
            return;
        }

        onChange([...recipients, ...dedupRecipients]);
    };

    const handleRecipientRemove = (toRemove: Recipient) => () => {
        onChange(recipients.filter((recipient) => recipient !== toRemove));
        inputRef.current?.focus();
    };

    const handleRecipientChange = (toChange: Recipient) => (value: Recipient) => {
        if (!isNonEmptyRecipient(value)) {
            return handleRecipientRemove(toChange)();
        }

        if (recipients.some(({ Address }) => Address === value.Address)) {
            showDuplicateNotif([value.Address]);
            return handleRecipientRemove(toChange)();
        }

        onChange(recipients.map((recipient) => (recipient === toChange ? value : recipient)));
    };

    const handleGroupChange = (toChange?: RecipientGroup) => (value: RecipientGroup) => {
        onChange([...recipientsWithoutGroup(recipients, toChange?.group?.Path), ...value.recipients]);
    };

    const handleGroupRemove = (toRemove?: RecipientGroup) => () => {
        onChange(recipientsWithoutGroup(recipients, toRemove?.group?.Path));
        inputRef.current?.focus();
    };

    const handleInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && event.currentTarget.value.length === 0 && recipientsOrGroups.length > 0) {
            const last = recipientsOrGroups[recipientsOrGroups.length - 1];
            if (last.recipient) {
                handleRecipientRemove(last.recipient)();
            } else {
                handleGroupRemove(last.group)();
            }
        }
    };

    const { draggedRecipient, placeholderPosition, placeholderSize, containerDragHandlers, itemDragHandlers } =
        useAddressesInputDrag(recipientsOrGroups, setRecipientsOrGroups, onChange);

    const dragPlaceholder = (
        <div
            className="composer-addresses-item-drag-placeholder mt0-25 mb0-25 mr0-5 max-w100 no-pointer-events h-custom w-custom"
            style={{
                '--width-custom': `${placeholderSize?.width}px`,
                '--height-custom': `${placeholderSize?.height}px`,
            }}
        />
    );

    return (
        <div className={classnames(['composer-addresses-autocomplete w100 flex-item-fluid relative', classname])}>
            <div
                className={classnames([
                    'composer-addresses-container flex-no-min-children flex-item-fluid',
                    !expanded && 'composer-addresses-container-closed field',
                    hasLighterFieldDesign && 'composer-light-field',
                ])}
                onClick={handleClick}
                {...containerDragHandlers}
            >
                <div className="flex-item-fluid flex max-w100 max-h100 relative">
                    {recipientsOrGroups.map((recipientOrGroup, index) => (
                        <Fragment key={getRecipientOrGroupKey(recipientOrGroup)}>
                            {index === placeholderPosition && dragPlaceholder}
                            {recipientOrGroup.recipient ? (
                                <AddressesRecipientItem
                                    recipient={recipientOrGroup.recipient}
                                    messageSendInfo={messageSendInfo}
                                    onChange={handleRecipientChange(recipientOrGroup.recipient)}
                                    onRemove={handleRecipientRemove(recipientOrGroup.recipient)}
                                    dragged={draggedRecipient === recipientOrGroup}
                                    {...itemDragHandlers(recipientOrGroup)}
                                />
                            ) : (
                                <AddressesGroupItem
                                    recipientGroup={recipientOrGroup.group as RecipientGroup}
                                    messageSendInfo={messageSendInfo}
                                    onChange={handleGroupChange(recipientOrGroup.group)}
                                    onRemove={handleGroupRemove(recipientOrGroup.group)}
                                    dragged={draggedRecipient === recipientOrGroup}
                                    {...itemDragHandlers(recipientOrGroup)}
                                />
                            )}
                        </Fragment>
                    ))}
                    {placeholderPosition === recipientsOrGroups.length && dragPlaceholder}
                    <div className="flex-item-fluid flex flex-align-items-center composer-addresses-input-container">
                        <AddressesAutocomplete
                            id={id}
                            anchorRef={anchorRef}
                            ref={inputRef}
                            contactEmails={contactEmails}
                            contactGroups={contactGroups}
                            contactEmailsMap={contactEmailsMap}
                            groupsWithContactsMap={groupsWithContactsMap}
                            recipients={recipients}
                            onAddRecipients={handleAddRecipient}
                            onKeyDown={handleInputKey}
                            placeholder={recipients.length > 0 ? '' : placeholder}
                            hasEmailPasting
                            hasAddOnBlur
                            data-testid={dataTestId}
                        />
                    </div>
                </div>
                {addContactButton ? (
                    <span className="flex-item-noshrink flex-align-self-start sticky-top">
                        <Tooltip title={c('Action').t`Insert contacts`}>
                            <Button
                                type="button"
                                onClick={addContactAction}
                                color="weak"
                                shape="ghost"
                                icon
                                data-testid="composer:to-button"
                            >
                                <Icon name="user-plus" size={16} alt={addContactButton} />
                            </Button>
                        </Tooltip>
                    </span>
                ) : null}
            </div>
        </div>
    );
};

export default AddressesInput;
