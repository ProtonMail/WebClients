import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import InputField from '@proton/components/components/v2/field/InputField';
import {
    useApi,
    useGetDecryptedPassphraseAndCalendarKeys,
    useGetEncryptionPreferences,
    useLoading,
    useNotifications,
} from '@proton/components/hooks';
import { PublicKeyReference } from '@proton/crypto';
import { addMember } from '@proton/shared/lib/api/calendars';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/api';
import { MAX_CALENDAR_MEMBERS } from '@proton/shared/lib/calendar/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { filterOutAcceptedInvitations } from '@proton/shared/lib/calendar/share';
import { getSelfSendAddresses } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { Address, Recipient, SimpleMap } from '@proton/shared/lib/interfaces';
import { CalendarMember, CalendarMemberInvitation, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { encryptPassphraseSessionKey } from '@proton/shared/lib/keys/calendarKeys';
import {
    ENCRYPTION_PREFERENCES_ERROR_TYPES,
    EncryptionPreferencesError,
} from '@proton/shared/lib/mail/encryptionPreferences';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import remove from '@proton/utils/remove';

import {
    AddressesAutocompleteTwo,
    AddressesInput,
    AddressesInputItem,
    Badge,
    Icon,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    RadioGroup,
} from '../../../components';
import { useContactEmailsCache } from '../../contacts/ContactEmailsProvider';

export enum VALIDATION_ERRORR_TYPES {
    INVALID_EMAIL,
    NOT_PROTON_ACCOUNT,
    DOES_NOT_EXIST,
    EXISTING_MEMBER,
}
const { INVALID_EMAIL, NOT_PROTON_ACCOUNT, DOES_NOT_EXIST, EXISTING_MEMBER } = VALIDATION_ERRORR_TYPES;

const getValidationErrorMessage = (type: VALIDATION_ERRORR_TYPES) => {
    if (type === INVALID_EMAIL) {
        return c('Error').t`The address might be misspelled`;
    }
    if (type === NOT_PROTON_ACCOUNT) {
        return c('Error').t`Not a Proton account`;
    }
    if (type === DOES_NOT_EXIST) {
        return c('Error').t`Account does not exist`;
    }
    if (type === EXISTING_MEMBER) {
        return c('Error').t`Already a member of this calendar`;
    }
    return c('Error').t`Validation error`;
};

class ShareCalendarValdidationError extends Error {
    type: VALIDATION_ERRORR_TYPES;

    constructor(type: VALIDATION_ERRORR_TYPES) {
        const message = getValidationErrorMessage(type);
        super(message);
        this.type = type;
        Object.setPrototypeOf(this, ShareCalendarValdidationError.prototype);
    }
}

interface Props extends ModalProps {
    calendar: VisualCalendar;
    addresses: Address[];
    onFinish?: (invitations: CalendarMemberInvitation[]) => void;
    members: CalendarMember[];
    invitations: CalendarMemberInvitation[];
}

const ShareCalendarModal = ({ calendar, addresses, onFinish, members, invitations, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { contactEmails, contactGroups, contactEmailsMap, groupsWithContactsMap } = useContactEmailsCache();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getDecryptedPassphraseAndCalendarKeys = useGetDecryptedPassphraseAndCalendarKeys();
    const addressesAutocompleteRef = useRef<HTMLInputElement>(null);

    const [permissions, setPermissions] = useState<number>(MEMBER_PERMISSIONS.FULL_VIEW);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [invalidRecipients, setInvalidRecipients] = useState<
        SimpleMap<ShareCalendarValdidationError | EncryptionPreferencesError>
    >({});
    const [loading, withLoading] = useLoading();

    const currentEmails = recipients.map(({ Address }) => canonicalizeInternalEmail(Address));
    const pendingInvitations = filterOutAcceptedInvitations(invitations);
    const existingEmails = [...pendingInvitations, ...members].map(({ Email }) => canonicalizeInternalEmail(Email));
    const totalRecipients = recipients.length;
    const maxRecipients = Math.max(MAX_CALENDAR_MEMBERS - existingEmails.length, 0);

    const ownNormalizedEmails = getSelfSendAddresses(addresses).map(({ Email }) => canonicalizeInternalEmail(Email));

    useEffect(() => {
        if (!rest.open) {
            setRecipients([]);
            setInvalidRecipients({});
        }
    }, [rest.open]);

    const removeFromInvalidRecipients = (email: string) => {
        setInvalidRecipients((prevState) => ({
            ...prevState,
            [email]: undefined,
        }));
    };

    const showDuplicateNotification = (recipients: Recipient[]) => {
        const joinedRecipients = recipients.map((recipient) => recipient.Address).join(', ');

        // translator: "joinedRecipients" is the recipient list joined by a comma, e.g. "John, Jane, Joe"
        const text = c('Error').ngettext(
            msgid`Removed duplicate recipient: ${joinedRecipients}`,
            `Removed duplicate recipients: ${joinedRecipients}`,
            recipients.length
        );

        createNotification({
            text,
            type: 'warning',
        });
    };

    const handleAddRecipients = (recipients: Recipient[]) => {
        const { newRecipients, duplicateRecipients, existingRecipients } = recipients.reduce<{
            newRecipients: Recipient[];
            addedCanonicalizedAddresses: string[];
            duplicateRecipients: Recipient[];
            existingRecipients: Recipient[];
        }>(
            (acc, recipient) => {
                const address = recipient.Address;
                const canonicalizedAddress = canonicalizeInternalEmail(address);

                if (ownNormalizedEmails.includes(canonicalizedAddress)) {
                    createNotification({
                        type: 'error',
                        text: c('Calendar self sharing error').t`You already have access to this calendar`,
                    });

                    return acc;
                }

                if (!validateEmailAddress(address)) {
                    setInvalidRecipients((prevState) => ({
                        ...prevState,
                        [address]: new ShareCalendarValdidationError(INVALID_EMAIL),
                    }));
                }

                if (existingEmails.includes(canonicalizedAddress)) {
                    acc.existingRecipients.push(recipient);
                } else if ([...currentEmails, ...acc.addedCanonicalizedAddresses].includes(canonicalizedAddress)) {
                    acc.duplicateRecipients.push(recipient);
                } else {
                    acc.newRecipients.push(recipient);
                    acc.addedCanonicalizedAddresses.push(canonicalizedAddress);
                }

                return acc;
            },
            { newRecipients: [], addedCanonicalizedAddresses: [], duplicateRecipients: [], existingRecipients: [] }
        );

        if (existingRecipients.length) {
            setInvalidRecipients((prevState) => ({
                ...prevState,
                ...existingRecipients.reduce<SimpleMap<ShareCalendarValdidationError>>((acc, { Address }) => {
                    acc[Address] = new ShareCalendarValdidationError(EXISTING_MEMBER);

                    return acc;
                }, {}),
            }));
        }

        if (duplicateRecipients.length) {
            showDuplicateNotification(duplicateRecipients);
        }

        setRecipients((previousRecipients) => [...previousRecipients, ...newRecipients, ...existingRecipients]);
    };

    const handleShare = async (emails: string[]) => {
        const memberPublicKeys: SimpleMap<PublicKeyReference> = {};
        const invalidRecipients: SimpleMap<EncryptionPreferencesError | ShareCalendarValdidationError> = {};
        await Promise.all(
            emails.map(async (email) => {
                const { apiKeys, error, isInternal } = await getEncryptionPreferences(email, 0, contactEmailsMap);
                const [primaryApiKey] = apiKeys;

                if (error) {
                    return (invalidRecipients[email] = new EncryptionPreferencesError(
                        error.type,
                        reformatApiErrorMessage(error.message)
                    ));
                }

                if (!isInternal) {
                    return (invalidRecipients[email] = new ShareCalendarValdidationError(NOT_PROTON_ACCOUNT));
                }

                // This should not happen at this stage. Needed for Typescript
                if (!primaryApiKey) {
                    return (invalidRecipients[email] = new EncryptionPreferencesError(
                        ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY,
                        c('Error').t`No public key for Proton address`
                    ));
                }

                // No real benefit of using a trusted key here since the server could always fake the contact crypto preferences,
                // and there's no UI difference for the end user between a trusted key and a non-trusted one
                memberPublicKeys[email] = primaryApiKey;
            })
        );

        if (Object.keys(invalidRecipients).length) {
            setInvalidRecipients((prevState) => ({
                ...prevState,
                ...invalidRecipients,
            }));
            // to be caught by handleAddMembers
            throw new Error('Invalid recipients');
        }

        const { decryptedPassphraseSessionKey: sessionKey } = await getDecryptedPassphraseAndCalendarKeys(calendar.ID);
        const keyPacketsMap = await encryptPassphraseSessionKey({
            sessionKey,
            memberPublicKeys,
        });

        const addressID = addresses.find(({ Email }) => Email === calendar.Email)?.ID;

        if (!addressID) {
            throw new Error('Could not find address ID for calendar owner');
        }

        return api<{ Code: number; Invitations: CalendarMemberInvitation[] }>(
            addMember(calendar.ID, {
                AddressID: addressID,
                Members: Object.keys(memberPublicKeys).map((email) => {
                    const keyPacket = keyPacketsMap[email];

                    if (!keyPacket) {
                        throw new Error('No passphrase key packet for member');
                    }

                    return {
                        Email: email,
                        PassphraseKeyPacket: keyPacket,
                        Permissions: permissions,
                    };
                }),
            })
        );
    };

    const handleAddMembers = async () => {
        try {
            const { Invitations: newInvitations } = await handleShare(recipients.map(({ Address }) => Address));

            createNotification({
                type: 'success',
                text: c('Notification in share calendar modal').ngettext(
                    msgid`Member added`,
                    `Members added`,
                    newInvitations.length
                ),
            });

            onFinish?.(newInvitations);
            rest.onClose?.();
        } catch (error) {
            noop();
        }
    };

    const remainingSpots = maxRecipients - totalRecipients;
    const maxReachedError =
        remainingSpots < 0
            ? c('Share calendar max shares reached error').ngettext(
                  msgid`You have exceeded the maximum of ${MAX_CALENDAR_MEMBERS} member per calendar`,
                  `You have exceeded the maximum of ${MAX_CALENDAR_MEMBERS} members per calendar`,
                  MAX_CALENDAR_MEMBERS
              )
            : null;
    const hint = (
        <span className={clsx([remainingSpots < 0 && 'color-danger'])}>
            {totalRecipients}/{maxRecipients}
        </span>
    );
    const assistiveText =
        invalidRecipients &&
        Object.values(invalidRecipients)
            .filter(isTruthy)
            .some(({ type }) => type === NOT_PROTON_ACCOUNT)
            ? c('Share calendar assistive text').t`To invite non-Proton users, share your calendar with a link`
            : '';
    const addressesInputText = c('Calendar access select label').t`Add people or groups`;

    const items = recipients.map((recipient) => {
        const invalidEmailMessage = invalidRecipients[recipient.Address]?.message;
        const labelTooltip = (() => {
            if (invalidEmailMessage) {
                return invalidEmailMessage;
            }

            return recipient.Address;
        })();

        return (
            <AddressesInputItem
                key={recipient.Address}
                labelTooltipTitle={labelTooltip}
                label={recipient.Name}
                labelProps={{
                    className: clsx(['pt0-25 pb0-25', invalidEmailMessage && 'pl0-25']),
                }}
                icon={
                    invalidEmailMessage && (
                        <div className="flex flex-align-items-center ml0-5">
                            <Icon name="exclamation-circle" />
                        </div>
                    )
                }
                className={clsx([invalidEmailMessage && 'invalid'])}
                onClick={(event) => event.stopPropagation()}
                onRemove={() => {
                    setRecipients((prevState) => remove(prevState, recipient));
                    removeFromInvalidRecipients(recipient.Address);
                }}
            />
        );
    });

    const onAutocompleteKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && event.currentTarget.value.length === 0 && totalRecipients > 0) {
            setRecipients((prevState) => prevState.slice(0, -1));
        }
    };

    const isSubmitDisabled = !totalRecipients || Object.values(invalidRecipients).some(isTruthy) || remainingSpots < 0;
    const inputId = 'input-share-privately';
    const calendarName = (
        <span key="bold-calendar-name" className="text-bold text-break">
            {calendar.Name}
        </span>
    );

    return (
        <Modal size="large" {...rest} data-test-id="share-calendar-privately">
            <ModalHeader title={c('Share calendar modal title').t`Share with Proton users`} />
            <ModalContent>
                <div className="mb1">
                    {c('Share calendar modal description')
                        .jt`Add the Proton accounts with whom you want to share ${calendarName}. We’ll send them an invite.`}
                </div>
                <div className="mb1">
                    <InputField
                        as={AddressesInput}
                        ref={addressesAutocompleteRef}
                        hint={hint}
                        assistiveText={assistiveText}
                        onClick={() => {
                            document.getElementById(inputId)?.focus();
                        }}
                        autocomplete={
                            <AddressesAutocompleteTwo
                                hasAddOnBlur
                                id={inputId}
                                compact
                                anchorRef={addressesAutocompleteRef}
                                contactEmails={contactEmails}
                                excludedEmails={existingEmails}
                                contactGroups={contactGroups}
                                contactEmailsMap={contactEmailsMap}
                                groupsWithContactsMap={groupsWithContactsMap}
                                recipients={recipients}
                                onAddRecipients={handleAddRecipients}
                                className="min-w5e unstyled"
                                inputClassName={clsx([
                                    !totalRecipients && 'my0-15',
                                    !!totalRecipients && 'p0 rounded-none',
                                ])}
                                title={addressesInputText}
                                onKeyDown={onAutocompleteKeyDown}
                                placeholder={
                                    recipients.length
                                        ? ''
                                        : c('Share calendar modal input placeholder')
                                              .t`Enter an email address or group name`
                                }
                            />
                        }
                        items={items}
                        error={maxReachedError}
                        className={clsx(['multi-select-container', !!totalRecipients && 'px0-5 py0-15'])}
                        label={addressesInputText}
                    />
                </div>
                <div>
                    <InputField as="div" label={c('Calendar permissions label').t`Permissions`}>
                        <div>
                            <RadioGroup
                                name="calendar-sharing-access"
                                options={[
                                    {
                                        label: (
                                            <span className="flex-item-fluid">
                                                {c('Calendar sharing access option label')
                                                    .t`View (see all event details)`}
                                            </span>
                                        ),
                                        value: MEMBER_PERMISSIONS.FULL_VIEW,
                                    },
                                    {
                                        label: (
                                            <span className="flex-item-fluid">
                                                {c('Calendar sharing access option label')
                                                    .t`Edit (view, create and edit event details)`}{' '}
                                                <Badge type="info">{c('Badge').t`Coming soon`}</Badge>
                                            </span>
                                        ),
                                        value: MEMBER_PERMISSIONS.EDIT,
                                        disabled: true,
                                    },
                                ]}
                                onChange={(value) => setPermissions(value)}
                                value={permissions}
                            />
                        </div>
                        <div className="color-weak">
                            {c('Calendar permissions hint').t`You can change or remove permissions at any time.`}
                        </div>
                    </InputField>
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    loading={loading}
                    color="norm"
                    disabled={isSubmitDisabled}
                    type="submit"
                    onClick={() => withLoading(handleAddMembers())}
                >
                    {c('Action').t`Share`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ShareCalendarModal;
