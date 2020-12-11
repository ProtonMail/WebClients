import React, {
    useState,
    useEffect,
    useMemo,
    ChangeEvent,
    MutableRefObject,
    useRef,
    MouseEvent,
    Fragment,
} from 'react';
import { Input, classnames } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { ContactOrGroup } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { MAJOR_DOMAINS } from 'proton-shared/lib/constants';
import { getEmailParts } from 'proton-shared/lib/helpers/email';

import AddressesRecipientItem from './AddressesRecipientItem';
import {
    inputToRecipient,
    contactToRecipient,
    majorToRecipient,
    recipientsWithoutGroup,
    getRecipientOrGroupKey,
} from '../../../helpers/addresses';
import AddressesAutocomplete from './AddressesAutocomplete';
import AddressesGroupItem from './AddressesGroupItem';
import { RecipientGroup } from '../../../models/address';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { useAddressesInputDrag } from '../../../hooks/useAddressesInputDrag';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useContactCache } from '../../../containers/ContactProvider';

interface Props {
    id: string;
    recipients?: Recipient[];
    messageSendInfo?: MessageSendInfo;
    onChange: (value: Partial<Recipient>[]) => void;
    inputFocusRef?: MutableRefObject<() => void>;
    placeholder?: string;
    expanded?: boolean;
}

const AddressesInput = ({
    id,
    recipients = [],
    messageSendInfo,
    onChange,
    inputFocusRef,
    placeholder,
    expanded = false,
    ...rest
}: Props) => {
    const { groupsWithContactsMap } = useContactCache();
    const { getRecipientsOrGroups } = useRecipientLabel();

    const [inputModel, setInputModel] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);

    const [recipientsOrGroups, setRecipientsOrGroups] = useState(() => getRecipientsOrGroups(recipients));

    useEffect(() => setRecipientsOrGroups(getRecipientsOrGroups(recipients)), [recipients]);

    const majorDomains = useMemo(() => {
        const [localPart] = getEmailParts(inputModel);
        if (!localPart) {
            return [];
        }
        return MAJOR_DOMAINS.map((domain) => `${localPart}@${domain}`);
    }, [inputModel]);

    const confirmInput = () => {
        onChange([...recipients, inputToRecipient(inputModel)]);
        setInputModel('');
    };

    useEffect(() => {
        if (inputFocusRef) {
            inputFocusRef.current = inputRef.current?.focus.bind(inputRef.current) || noop;
        }
    }, []);

    const handleInputChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        const { value } = input;
        const values = value.split(/[,;]/).map((value) => value.trim());

        if (value === ';' || value === ',') {
            return;
        }

        if (values.length > 1) {
            onChange([...recipients, ...values.slice(0, -1).map(inputToRecipient)]);
            setInputModel(values[values.length - 1]);
        } else {
            setInputModel(input.value);
        }
    };

    const handleBlur = () => {
        if (inputModel.trim().length > 0) {
            confirmInput();
        }
    };

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        inputRef.current?.focus();
    };

    const handleRecipientChange = (toChange: Recipient) => (value: Recipient) => {
        onChange(recipients.map((recipient) => (recipient === toChange ? value : recipient)));
    };

    const handleRecipientRemove = (toRemove: Recipient) => () => {
        onChange(recipients.filter((recipient) => recipient !== toRemove));
    };

    const handleGroupChange = (toChange?: RecipientGroup) => (value: RecipientGroup) => {
        onChange([...recipientsWithoutGroup(recipients, toChange?.group?.Path), ...value.recipients]);
    };

    const handleGroupRemove = (toRemove?: RecipientGroup) => () => {
        onChange(recipientsWithoutGroup(recipients, toRemove?.group?.Path));
    };

    const handleInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if ((event.key === 'Enter' || event.key === 'Tab') && inputModel.length !== 0) {
            confirmInput();
            event.preventDefault(); // Prevent tab to switch field
        }
        if (event.key === 'Backspace' && inputModel.length === 0 && recipientsOrGroups.length > 0) {
            const last = recipientsOrGroups[recipientsOrGroups.length - 1];
            if (last.recipient) {
                handleRecipientRemove(last.recipient)();
            } else {
                handleGroupRemove(last.group)();
            }
        }
    };

    const handleAutocompleteSelect = ({ contact, group, major }: ContactOrGroup) => {
        if (contact) {
            onChange([...recipients, contactToRecipient(contact)]);
        } else if (group) {
            const groupContacts = groupsWithContactsMap[group.ID]?.contacts || [];
            const groupRecipients = groupContacts.map((contact) => contactToRecipient(contact, group.Path));
            onChange([...recipients, ...groupRecipients]);
        } else if (major) {
            onChange([...recipients, majorToRecipient(major)]);
        }
        setInputModel('');
    };

    const {
        draggedRecipient,
        placeholderPosition,
        placeholderSize,
        containerDragHandlers,
        itemDragHandlers,
    } = useAddressesInputDrag(recipientsOrGroups, setRecipientsOrGroups, onChange);

    const dragPlaceholder = (
        <div
            className="composer-addresses-item-drag-placeholder mt0-25 mb0-25 mr0-5 mw100 no-pointer-events"
            style={{ width: `${placeholderSize?.width}px`, height: `${placeholderSize?.height}px` }}
        />
    );

    return (
        <AddressesAutocomplete
            inputRef={inputRef}
            // Chrome ignores autocomplete="off" and Awesome lib forces autocomplete to "off" after instance
            autoComplete="no"
            majorDomains={majorDomains}
            onSelect={handleAutocompleteSelect}
            currentValue={recipients}
        >
            <div
                className={classnames([
                    'composer-addresses-container pm-field flex-item-fluid bordered-container',
                    !expanded && 'composer-addresses-container-closed',
                ])}
                onClick={handleClick}
                {...containerDragHandlers}
            >
                {recipientsOrGroups.map((recipientOrGroup, index) => (
                    <Fragment key={getRecipientOrGroupKey(recipientOrGroup)}>
                        {index === placeholderPosition && dragPlaceholder}
                        {recipientOrGroup.recipient ? (
                            <AddressesRecipientItem
                                recipient={
                                    recipientOrGroup.recipient as Required<Pick<Recipient, 'Address' | 'ContactID'>>
                                }
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
                <div className="flex-item-fluid flex flex-items-center composer-addresses-input-container">
                    <Input
                        id={id}
                        value={inputModel}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKey}
                        onBlur={handleBlur}
                        ref={inputRef}
                        placeholder={recipients.length > 0 ? '' : placeholder}
                        data-testid="composer-addresses-input"
                        {...rest}
                    />
                </div>
            </div>
        </AddressesAutocomplete>
    );
};

export default AddressesInput;
