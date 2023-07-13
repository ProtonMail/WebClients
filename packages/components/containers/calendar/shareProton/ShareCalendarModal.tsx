import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import InputField from '@proton/components/components/v2/field/InputField';
import {
    useApi,
    useGetAddressKeys,
    useGetDecryptedPassphraseAndCalendarKeys,
    useGetEncryptionPreferences,
    useNotifications,
} from '@proton/components/hooks';
import { PublicKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { addMember } from '@proton/shared/lib/api/calendars';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/api';
import { MAX_CALENDAR_MEMBERS } from '@proton/shared/lib/calendar/constants';
import { encryptPassphraseSessionKey } from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { filterOutAcceptedInvitations } from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getSelfSendAddresses } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, Recipient, RequireSome, SimpleMap } from '@proton/shared/lib/interfaces';
import { CalendarMember, CalendarMemberInvitation, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { GetEncryptionPreferences } from '@proton/shared/lib/interfaces/hooks/GetEncryptionPreferences';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import {
    AddressesAutocompleteTwo,
    AddressesInput,
    AddressesInputItem,
    Icon,
    Loader,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    RadioGroup,
} from '../../../components';
import { useContactEmailsCache } from '../../contacts/ContactEmailsProvider';

export enum VALIDATION_ERROR_TYPES {
    INVALID_EMAIL,
    NOT_PROTON_ACCOUNT,
    DOES_NOT_EXIST,
    EXISTING_MEMBER,
}
const { INVALID_EMAIL, NOT_PROTON_ACCOUNT, DOES_NOT_EXIST, EXISTING_MEMBER } = VALIDATION_ERROR_TYPES;

const getValidationErrorMessage = (type: VALIDATION_ERROR_TYPES) => {
    if (type === INVALID_EMAIL) {
        return c('Error').t`The address might be misspelled`;
    }
    if (type === NOT_PROTON_ACCOUNT) {
        return c('Error').t`Not a ${BRAND_NAME} account`;
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
    type: VALIDATION_ERROR_TYPES;

    constructor(type: VALIDATION_ERROR_TYPES) {
        const message = getValidationErrorMessage(type);
        super(message);
        this.type = type;
        Object.setPrototypeOf(this, ShareCalendarValdidationError.prototype);
    }
}

type RecipientError = ShareCalendarValdidationError | EncryptionPreferencesError;

interface RecipientWithAddedTime extends Recipient {
    addedTime: number;
}

interface ExtendedRecipient extends RecipientWithAddedTime {
    loading?: boolean;
    error?: RecipientError;
    publicKey?: PublicKeyReference;
    isKeyPinned?: boolean;
}

const getRecipientHasError = (recipient: ExtendedRecipient): recipient is RequireSome<ExtendedRecipient, 'error'> => {
    return !!recipient.error;
};

const loadRecipient = async ({
    recipient,
    setRecipientsMap,
    getEncryptionPreferences,
    contactEmailsMap,
    onError,
}: {
    recipient: RecipientWithAddedTime;
    setRecipientsMap: Dispatch<SetStateAction<SimpleMap<ExtendedRecipient>>>;
    getEncryptionPreferences: GetEncryptionPreferences;
    contactEmailsMap: SimpleMap<ContactEmail>;
    onError: (error: Error) => void;
}) => {
    const { Address: email } = recipient;
    setRecipientsMap((map) => ({
        ...map,
        [email]: {
            ...recipient,
            loading: true,
        },
    }));

    try {
        const { sendKey, isSendKeyPinned, error, isInternal } = await getEncryptionPreferences(
            email,
            0,
            contactEmailsMap
        );

        if (error) {
            setRecipientsMap((map) => ({
                ...map,
                [email]: {
                    ...recipient,
                    loading: false,
                    error: new EncryptionPreferencesError(error.type, reformatApiErrorMessage(error.message)),
                },
            }));
        } else if (!isInternal) {
            setRecipientsMap((map) => ({
                ...map,
                [email]: {
                    ...recipient,
                    loading: false,
                    error: new ShareCalendarValdidationError(NOT_PROTON_ACCOUNT),
                },
            }));
        } else {
            setRecipientsMap((map) => ({
                ...map,
                [email]: {
                    ...recipient,
                    loading: false,
                    publicKey: sendKey,
                    isKeyPinned: isSendKeyPinned,
                },
            }));
        }
    } catch (e: any) {
        const error = e instanceof Error ? e : new Error('Failed to fetch encryption preferences');

        onError(error);
        setRecipientsMap((map) => {
            const result = { ...map };
            delete result[email];

            return result;
        });
    }
};

const getAddressInputItemAttributes = ({ loading, error, Address, isKeyPinned }: ExtendedRecipient) => {
    if (loading) {
        return {
            icon: <Loader className="icon-16p pl-2 m-auto flex flex-item-noshrink" />,
        };
    }
    if (error) {
        return {
            icon: (
                <div className="flex flex-align-items-center flex-item-noshrink ml-2">
                    <Icon name="exclamation-circle" />
                </div>
            ),
            iconTooltip: error.message,
            labelTooltip: Address,
        };
    }
    return {
        icon: (
            <span className="inline-flex pl-2 flex-item-noshrink my-auto">
                <Icon size={16} name={isKeyPinned ? 'lock-check-filled' : 'lock-filled'} className={'color-info'} />
            </span>
        ),
        iconTooltip: isKeyPinned
            ? c('Tooltip; share calendar modal ').t`Shared end-to-end encrypted with verified contact`
            : c('Tooltip; share calendar modal ').t`Shared end-to-end encrypted`,
        labelTooltip: Address,
    };
};

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
    const getAddressKeys = useGetAddressKeys();
    const getDecryptedPassphraseAndCalendarKeys = useGetDecryptedPassphraseAndCalendarKeys();
    const addressesAutocompleteRef = useRef<HTMLInputElement>(null);

    const [permissions, setPermissions] = useState<number>(MEMBER_PERMISSIONS.FULL_VIEW);
    const [recipientsMap, setRecipientsMap] = useState<SimpleMap<ExtendedRecipient>>({});
    const [loadingShare, withLoadingShare] = useLoading(false);

    const recipients = Object.values(recipientsMap)
        .filter(isTruthy)
        .sort(({ addedTime: a }, { addedTime: b }) => a - b);
    const invalidRecipients = recipients.filter(getRecipientHasError);
    const hasExternalRecipients = invalidRecipients.some(({ error }) => error.type === NOT_PROTON_ACCOUNT);
    const currentEmails = recipients.map(({ Address }) => canonicalizeInternalEmail(Address));
    const pendingInvitations = filterOutAcceptedInvitations(invitations);
    const existingEmails = [...pendingInvitations, ...members].map(({ Email }) => canonicalizeInternalEmail(Email));
    const totalRecipients = recipients.length;
    const maxRecipients = Math.max(MAX_CALENDAR_MEMBERS - existingEmails.length, 0);
    const isLoadingRecipients = recipients.some(({ loading }) => loading);

    const ownNormalizedEmails = getSelfSendAddresses(addresses).map(({ Email }) => canonicalizeInternalEmail(Email));

    useEffect(() => {
        if (!rest.open) {
            setRecipientsMap({});
            setPermissions(MEMBER_PERMISSIONS.FULL_VIEW);
        }
    }, [rest.open]);

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
        const { duplicateRecipients, existingRecipients } = recipients.reduce<{
            newRecipients: Recipient[];
            addedCanonicalizedAddresses: string[];
            duplicateRecipients: RecipientWithAddedTime[];
            existingRecipients: RecipientWithAddedTime[];
        }>(
            (acc, recipient) => {
                const address = recipient.Address;
                const canonicalizedAddress = canonicalizeInternalEmail(address);
                const recipientWithAddedTime = {
                    ...recipient,
                    addedTime: Date.now(),
                };

                if (ownNormalizedEmails.includes(canonicalizedAddress)) {
                    createNotification({
                        type: 'error',
                        text: c('Calendar self sharing error').t`You already have access to this calendar`,
                    });

                    return acc;
                }

                if (!validateEmailAddress(address)) {
                    setRecipientsMap((map) => ({
                        ...map,
                        [address]: {
                            ...recipientWithAddedTime,
                            error: new ShareCalendarValdidationError(INVALID_EMAIL),
                        },
                    }));
                }

                if (existingEmails.includes(canonicalizedAddress)) {
                    acc.existingRecipients.push(recipientWithAddedTime);
                } else if ([...currentEmails, ...acc.addedCanonicalizedAddresses].includes(canonicalizedAddress)) {
                    acc.duplicateRecipients.push(recipientWithAddedTime);
                } else {
                    const onError = (error: Error) => {
                        console.error(error);
                        createNotification({
                            type: 'error',
                            // translator: The variable ${address} is an email here. E.g.: Failed to retrieve contact information for eric.norbert@proton.me
                            text: c('Calendar sharing error').t`Failed to retrieve contact information for ${address}`,
                        });
                    };
                    loadRecipient({
                        recipient: recipientWithAddedTime,
                        setRecipientsMap,
                        getEncryptionPreferences,
                        contactEmailsMap,
                        onError,
                    });
                    acc.newRecipients.push(recipientWithAddedTime);
                    acc.addedCanonicalizedAddresses.push(canonicalizedAddress);
                }

                return acc;
            },
            { newRecipients: [], addedCanonicalizedAddresses: [], duplicateRecipients: [], existingRecipients: [] }
        );

        if (existingRecipients.length) {
            setRecipientsMap((map) => ({
                ...map,
                ...existingRecipients.reduce<SimpleMap<ExtendedRecipient>>((acc, recipient) => {
                    acc[recipient.Address] = {
                        ...recipient,
                        loading: false,
                        error: new ShareCalendarValdidationError(EXISTING_MEMBER),
                    };

                    return acc;
                }, {}),
            }));
        }

        if (duplicateRecipients.length) {
            showDuplicateNotification(duplicateRecipients);
        }
    };

    const handleShare = async () => {
        const memberPublicKeys = recipients.reduce<{ [email: string]: PublicKeyReference }>(
            (acc, { Address, publicKey }) => {
                if (!publicKey) {
                    throw new Error('No public key for member');
                }
                acc[Address] = publicKey;

                return acc;
            },
            {}
        );

        const addressID = addresses.find(({ Email }) => Email === calendar.Email)?.ID;

        if (!addressID) {
            throw new Error('Could not find address ID for calendar owner');
        }

        const [{ decryptedPassphraseSessionKey: sessionKey }, addressKeys] = await Promise.all([
            getDecryptedPassphraseAndCalendarKeys(calendar.ID),
            getAddressKeys(addressID),
        ]);
        const primaryAddressKey = getPrimaryKey(addressKeys)?.privateKey;

        if (!primaryAddressKey) {
            throw new Error('Could not find primary address key for calendar owner');
        }

        const { armoredSignature, encryptedSessionKeyMap } = await encryptPassphraseSessionKey({
            sessionKey,
            memberPublicKeys,
            signingKey: primaryAddressKey,
        });

        return api<{ Code: number; Invitations: CalendarMemberInvitation[] }>(
            addMember(calendar.ID, {
                AddressID: addressID,
                Signature: armoredSignature,
                Members: Object.keys(memberPublicKeys).map((email) => {
                    const keyPacket = encryptedSessionKeyMap[email];

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
            const { Invitations: newInvitations } = await handleShare();

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
    const assistiveText = (
        <span className="cursor-default">
            {c('Share calendar assistive text').t`To invite non-${BRAND_NAME} users, share your calendar with a link.`}{' '}
            <Href href={getKnowledgeBaseUrl('/share-calendar-via-link')}>
                {c('Knowledge base link label').t`Here's how`}
            </Href>
        </span>
    );
    const addressesInputText = c('Calendar access select label').t`Add people or groups`;

    const items = recipients.map((recipient) => {
        const { Name, Address, error } = recipient;
        const { icon, iconTooltip, labelTooltip } = getAddressInputItemAttributes(recipient);

        return (
            <AddressesInputItem
                key={Address}
                labelTooltipTitle={labelTooltip}
                label={Name}
                labelProps={{
                    className: clsx(['py-1', error && 'pl-1']),
                }}
                icon={icon}
                iconTooltipTitle={iconTooltip}
                className={clsx([error && 'invalid'])}
                onClick={(event) => event.stopPropagation()}
                onRemove={() => {
                    setRecipientsMap((map) => {
                        const result = { ...map };
                        delete result[Address];

                        return result;
                    });
                }}
            />
        );
    });

    const onAutocompleteKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && event.currentTarget.value.length === 0 && totalRecipients > 0) {
            setRecipientsMap((map) => Object.fromEntries(Object.entries(map).slice(0, -1)));
        }
    };

    const isSubmitDisabled =
        !totalRecipients ||
        isLoadingRecipients ||
        Object.values(invalidRecipients).some(isTruthy) ||
        remainingSpots < 0;
    const inputId = 'input-share-privately';
    const calendarName = (
        <span key="bold-calendar-name" className="text-bold text-break">
            {calendar.Name}
        </span>
    );

    return (
        <Modal size="large" {...rest} data-testid="share-calendar-privately">
            <ModalHeader title={c('Share calendar modal title').t`Share with ${BRAND_NAME} users`} />
            <ModalContent>
                <div className="mb-4">
                    {c('Share calendar modal description')
                        .jt`Add the ${BRAND_NAME} accounts with whom you want to share ${calendarName}. We’ll send them an invite.`}
                </div>
                <div className="mb-4">
                    <InputField
                        as={AddressesInput}
                        ref={addressesAutocompleteRef}
                        hint={maxReachedError ? hint : null}
                        id={inputId}
                        assistiveText={hasExternalRecipients ? assistiveText : null}
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
                                    !totalRecipients && 'my-0.5',
                                    !!totalRecipients && 'p-0 rounded-none',
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
                        className={clsx(['multi-select-container', !!totalRecipients && 'px-2 py-0.5'])}
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
                                                    .t`Edit (view, create and edit event details)`}
                                            </span>
                                        ),
                                        value: MEMBER_PERMISSIONS.EDIT,
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
                    loading={loadingShare}
                    color="norm"
                    disabled={isSubmitDisabled}
                    type="submit"
                    onClick={() => withLoadingShare(handleAddMembers())}
                >
                    {c('Action').t`Share`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ShareCalendarModal;
