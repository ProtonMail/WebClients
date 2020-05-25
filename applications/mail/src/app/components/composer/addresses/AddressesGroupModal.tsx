import React, { useState, ChangeEvent, useEffect } from 'react';
import { c } from 'ttag';
import {
    Checkbox,
    FormModal,
    generateUID,
    Label,
    useGetEncryptionPreferences,
    classnames,
    PrimaryButton,
    useModals
} from 'react-components';

import { OpenPGPKey } from 'pmcrypto';
import { processApiRequestsSafe } from 'proton-shared/lib/api/helpers/safeApiRequests';
import { noop } from 'proton-shared/lib/helpers/function';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { EncryptionPreferencesFailureTypes } from 'proton-shared/lib/mail/encryptionPreferences';

import { ContactEmail, ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { contactToInput } from '../../../helpers/addresses';
import getSendPreferences from '../../../helpers/message/getSendPreferences';
import { getSendStatusIcon } from '../../../helpers/message/icon';
import { RecipientGroup } from '../../../models/address';
import { STATUS_ICONS_FILLS } from '../../../models/crypto';
import { RequireSome } from '../../../models/utils';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import { MessageSendInfo } from './AddressesInput';
import AskForKeyPinningModal from './AskForKeyPinningModal';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';

const { INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED } = EncryptionPreferencesFailureTypes;
const primaryKeyNotPinnedFailureTypes = [INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED] as any[];

interface Params {
    emailAddress: string;
    contactID: string;
    abortController: AbortController;
    checkForFailure: boolean;
}

type MapLoading = { [key: string]: boolean };

interface Props {
    recipientGroup: RecipientGroup;
    contacts: ContactEmail[];
    messageSendInfo?: MessageSendInfo;
    onClose: () => void;
    onSubmit: (recipientGroup: RecipientGroup) => void;
}

const AddressesGroupModal = ({ recipientGroup, contacts, messageSendInfo, onSubmit, onClose, ...rest }: Props) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const { createModal } = useModals();
    const [uid] = useState<string>(generateUID('addresses-group-modal'));
    const [model, setModel] = useState<RecipientGroup>(recipientGroup);
    const [mapLoading, setMapLoading] = useState<MapLoading>(() =>
        contacts.reduce<MapLoading>((acc, { Email }) => {
            const icon = messageSendInfo?.mapSendInfo[Email]?.sendIcon;
            acc[Email] = !icon;
            return acc;
        }, {})
    );

    const allIconsLoaded = !contacts.some(({ Email }) => mapLoading[Email] === true);
    const isChecked = (contact: ContactEmail) =>
        !!model?.recipients?.find((recipient) => contact.Email === recipient.Address);

    const handleChange = (contact: ContactEmail) => (event: ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        const recipients = model.recipients || [];
        let newValue;
        if (checked) {
            newValue = [
                ...recipients,
                { Name: contact.Name, Address: contact.Email, Group: recipientGroup?.group?.Path }
            ];
        } else {
            newValue = recipients.filter((recipient) => recipient.Address !== contact.Email);
        }
        setModel({ group: model?.group, recipients: newValue });
    };

    const handleSubmit = () => {
        onSubmit(model);
        onClose();
    };

    useEffect(() => {
        const abortController = new AbortController();
        const loadSendIcon = async ({ emailAddress, contactID, abortController, checkForFailure }: Params) => {
            const { signal } = abortController;
            const icon = messageSendInfo?.mapSendInfo[emailAddress]?.sendIcon;
            const emailValidation = validateEmailAddress(emailAddress);
            if (
                !emailValidation ||
                !emailAddress ||
                icon ||
                !messageSendInfo ||
                !!messageSendInfo.mapSendInfo[emailAddress] ||
                signal.aborted
            ) {
                return;
            }
            const { message, setMapSendInfo } = messageSendInfo;
            const encryptionPreferences = await getEncryptionPreferences(emailAddress);
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
            const sendIcon = getSendStatusIcon(sendPreferences);
            !signal.aborted &&
                setMapSendInfo((mapSendInfo) => ({
                    ...mapSendInfo,
                    [emailAddress]: {
                        sendPreferences,
                        sendIcon,
                        emailValidation,
                        emailAddressWarnings: encryptionPreferences.emailAddressWarnings || []
                    }
                }));
            !signal.aborted && setMapLoading((loadingMap) => ({ ...loadingMap, [emailAddress]: false }));
            if (checkForFailure && primaryKeyNotPinnedFailureTypes.includes(sendPreferences.failure?.type)) {
                return {
                    contactID,
                    emailAddress,
                    isInternal: encryptionPreferences.isInternal,
                    bePinnedPublicKey: encryptionPreferences.sendKey as OpenPGPKey
                };
            }
            return;
        };

        const loadSendIcons = async ({
            abortController,
            checkForFailure
        }: Pick<Params, 'abortController' | 'checkForFailure'>): Promise<void> => {
            const requests = contacts.map(({ Email, ContactID }) => () =>
                loadSendIcon({ emailAddress: Email, contactID: ContactID, abortController, checkForFailure })
            );
            // the routes called in requests support 100 calls every 10 seconds
            const contactsKeyPinning: RequireSome<ContactWithBePinnedPublicKey, 'contactID'>[] = (
                await processApiRequestsSafe(requests, 100, 10 * 1000)
            ).filter(isTruthy);
            if (contactsKeyPinning.length) {
                await new Promise((resolve) => {
                    createModal(
                        <AskForKeyPinningModal
                            contacts={contactsKeyPinning}
                            onSubmit={resolve}
                            onClose={resolve}
                            onNotTrust={noop}
                            onError={noop}
                        />
                    );
                });
                return await loadSendIcons({ abortController, checkForFailure: false });
            }
        };
        loadSendIcons({ abortController, checkForFailure: true });

        return () => {
            abortController.abort();
        };
    }, []);

    const members = c('Info').t`Members`;
    const title = `${recipientGroup?.group?.Name} (${contacts.length} ${members})`;

    const submit = <PrimaryButton type="submit" disabled={!allIconsLoaded}>{c('Action').t`Save`}</PrimaryButton>;

    return (
        <FormModal submit={submit} title={title} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ul className="unstyled">
                {contacts.map((contact) => {
                    const id = `${uid}-${contact.ID}`;
                    const icon = messageSendInfo?.mapSendInfo[contact.Email]?.sendIcon;
                    const loading = mapLoading[contact.Email];
                    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL;
                    return (
                        <li key={contact.ID} className="mb0-5">
                            <Checkbox id={id} checked={isChecked(contact)} onChange={handleChange(contact)} />
                            <span className="min-w1-4e inline-flex alignmiddle">
                                {(icon || loading) && <EncryptionStatusIcon loading={loading} {...icon} />}
                            </span>
                            <Label
                                htmlFor={id}
                                className={classnames(['pt0 pl0-5', cannotSend && 'color-global-warning'])}
                            >
                                {contactToInput(contact)}
                            </Label>
                        </li>
                    );
                })}
            </ul>
        </FormModal>
    );
};

export default AddressesGroupModal;
