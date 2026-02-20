import { useMemo } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useApi, useModalState, useNotifications } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { MessageVerification, MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { useDispatch } from '@proton/redux-shared-store';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { canonicalizeInternalEmail, extractEmailFromUserID } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, MailSettings } from '@proton/shared/lib/interfaces';
import type { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { PROMPT_PIN } from '@proton/shared/lib/mail/mailSettings';
import { isInternal } from '@proton/shared/lib/mail/messages';

import { getContactEmail } from '../../../../helpers/message/messageRecipients';
import { useContactsMap } from '../../../../hooks/contact/useContacts';
import TrustPublicKeyModal from '../../modals/TrustPublicKeyModal';

enum PROMPT_KEY_PINNING_TYPE {
    AUTOPROMPT = 1,
    PIN_UNSEEN,
    PIN_ATTACHED_SIGNING,
    PIN_ATTACHED,
}

interface Params {
    messageVerification: MessageVerification;
    mailSettings: MailSettings;
    addresses: Address[] | undefined;
    senderAddress: string;
}

const getFirstAttachedKeyMatchingSender = (senderAddress: string, attachedPublicKeys: PublicKeyReference[]) => {
    const canonicalizedSenderAddress = canonicalizeInternalEmail(senderAddress);
    return attachedPublicKeys.find((key) =>
        key.getUserIDs().some((userID) => {
            const canonicalizedKeyAddress = canonicalizeInternalEmail(extractEmailFromUserID(userID) || userID);
            return canonicalizedKeyAddress === canonicalizedSenderAddress;
        })
    );
};

const getPromptKeyPinningType = ({
    messageVerification,
    mailSettings,
    addresses,
    senderAddress,
}: Params): PROMPT_KEY_PINNING_TYPE | undefined => {
    const canonicalizedSenderAddress = canonicalizeInternalEmail(senderAddress);
    if (addresses?.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalizedSenderAddress)) {
        // Do not pin keys for own addresses
        return undefined;
    }
    const { PromptPin } = mailSettings;
    const {
        senderPinnedKeys = [],
        senderPinnableKeys = [],
        attachedPublicKeys = [],
        signingPublicKey,
        verificationStatus,
    } = messageVerification;
    const findKey = (keyToFind: PublicKeyReference, keys: PublicKeyReference[]) =>
        keys.find((key) => keyToFind.equals(key, true));
    switch (verificationStatus) {
        case undefined:
            return;
        case MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID: {
            // This case occurs if KT is enabled, or if pinned keys are present.
            // With KT enabled, verification will succeed even with no pinned keys;
            // we still want to prompt for key pinning if the user has opted-in for that
            if (!signingPublicKey) {
                throw new Error('signing public key expected');
            }
            const isSigningKeyPinned = !!findKey(signingPublicKey, senderPinnedKeys);
            if (!isSigningKeyPinned && PromptPin) {
                return PROMPT_KEY_PINNING_TYPE.AUTOPROMPT;
            }
            break;
        }
        case MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID: {
            // This case occurs if KT is enabled, or if pinned keys are present.
            // It might be that the signature is invalid (due to data corruption) or simply
            // that the signing key does not match any of the verification keys.
            if (!signingPublicKey) {
                // none of the available keys matches the signing keyID
                return;
            }
            const senderHasPinnedKeys = !!senderPinnedKeys.length;
            if (senderHasPinnedKeys) {
                const isSignedByPinnableApiKeys = !!findKey(signingPublicKey, senderPinnableKeys);
                return isSignedByPinnableApiKeys ? PROMPT_KEY_PINNING_TYPE.PIN_UNSEEN : undefined;
            }
            const isSignedByAttachedKey = !!findKey(signingPublicKey, attachedPublicKeys);
            if (isSignedByAttachedKey) {
                return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED_SIGNING;
            }
            break;
        }
        case MAIL_VERIFICATION_STATUS.NOT_VERIFIED: {
            // This case occurs when KT is not enabled, and no pinned keys are present,
            // but API keys, as well as attached or autocrypt keys might be available
            if (!signingPublicKey) {
                // no verification keys are actually available
                return;
            }
            const isSignedByPinnableApiKeys = senderPinnableKeys.some((key) => signingPublicKey.equals(key, true));
            if (PromptPin && isSignedByPinnableApiKeys) {
                return PROMPT_KEY_PINNING_TYPE.AUTOPROMPT;
            }
            const isSignedByAttachedKey = !!findKey(signingPublicKey, attachedPublicKeys);
            if (isSignedByAttachedKey) {
                return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED_SIGNING;
            }
            break;
        }
        case MAIL_VERIFICATION_STATUS.NOT_SIGNED: {
            if (getFirstAttachedKeyMatchingSender(senderAddress, attachedPublicKeys)) {
                return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED;
            }
            break;
        }
        default:
            throw new Error('Unknown verification status');
    }
};

const getBannerMessage = (promptKeyPinningType: PROMPT_KEY_PINNING_TYPE) => {
    if (promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.PIN_UNSEEN) {
        return c('Info').t`This message is signed by a key that has not been trusted yet.`;
    }
    if (promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED_SIGNING) {
        return c('Info').t`This message is signed by the key attached, that has not been trusted yet.`;
    }
    if (promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED) {
        return c('Info').t`This message has a key attached, that has not been trusted yet.`;
    }
    if (promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.AUTOPROMPT) {
        return c('Info').t`This sender's public key has not been trusted yet.`;
    }
};

interface Props {
    message: MessageWithOptionalBody;
    messageVerification: MessageVerification;
}

const ExtraPinKey = ({ message, messageVerification }: Props) => {
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();
    const [loadingDisablePromptPin, withLoadingDisablePromptPin] = useLoading();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const contactsMap = useContactsMap();

    const [trustPublicKeyModalProps, setTrustPublicKeyModalOpen, renderTrustPublicKeyModal] = useModalState();

    const senderAddress = message.Sender.Address;
    const name = message.Sender.Name;
    const isSenderInternal = isInternal(message);
    const messageContactID = message?.Sender.ContactID;
    const contactID = useMemo<string | undefined>(() => {
        if (messageContactID) {
            return messageContactID;
        }
        if (!senderAddress) {
            return;
        }
        const preferredContact = getContactEmail(contactsMap, senderAddress);
        return preferredContact?.ContactID;
    }, [messageContactID, contactsMap, senderAddress]);
    const promptKeyPinningType = useMemo<PROMPT_KEY_PINNING_TYPE | undefined>(() => {
        if (!senderAddress) {
            return undefined;
        }
        return getPromptKeyPinningType({ messageVerification, mailSettings, addresses, senderAddress });
    }, [messageVerification, mailSettings, addresses, senderAddress]);
    const isPinUnseen = promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.PIN_UNSEEN;
    const firstAttachedPublicKeyMatchingSender = getFirstAttachedKeyMatchingSender(
        senderAddress,
        messageVerification?.attachedPublicKeys ?? []
    );
    const bePinnedPublicKey = messageVerification?.signingPublicKey || firstAttachedPublicKeyMatchingSender;
    const loading = loadingDisablePromptPin || !senderAddress || (isPinUnseen && !contactID) || !bePinnedPublicKey;

    // Prevent to propose an already pinned key even if for a strange reason,
    // the suggested key is already pinned yet the verification still fails
    const signingPublicKeyAlreadyPinned = messageVerification?.senderPinnedKeys?.some((pinKey) =>
        bePinnedPublicKey?.equals(pinKey, true)
    );

    const contact = useMemo<ContactWithBePinnedPublicKey>(() => {
        return {
            emailAddress: senderAddress || '',
            name,
            contactID,
            isInternal: isSenderInternal,
            bePinnedPublicKey: bePinnedPublicKey as PublicKeyReference,
        };
    }, [senderAddress, name, contactID, isSenderInternal, bePinnedPublicKey]);

    if (promptKeyPinningType === undefined || signingPublicKeyAlreadyPinned) {
        return null;
    }

    const handleDisablePromptPin = async () => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updatePromptPin(PROMPT_PIN.DISABLED));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Success').t`Address verification disabled` });
    };
    const handleTrustKey = () => {
        if (loading || !bePinnedPublicKey || !senderAddress) {
            return;
        }
        setTrustPublicKeyModalOpen(true);
    };

    return (
        <Banner
            variant="norm-outline"
            icon={<IcInfoCircleFilled className="color-info" />}
            link={
                promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.AUTOPROMPT ? (
                    <InlineLinkButton
                        disabled={loadingDisablePromptPin}
                        onClick={() => withLoadingDisablePromptPin(handleDisablePromptPin())}
                    >
                        {c('Action').t`Never show`}
                    </InlineLinkButton>
                ) : (
                    <Href href={getKnowledgeBaseUrl('/address-verification')}>{c('Link').t`Learn more`}</Href>
                )
            }
            action={
                <Button onClick={handleTrustKey} disabled={loading} data-testid="extra-pin-key:trust-button">
                    {c('Action').t`Trust key`}
                </Button>
            }
            data-testid="extra-pin-key:banner"
        >
            {getBannerMessage(promptKeyPinningType)}
            {renderTrustPublicKeyModal && <TrustPublicKeyModal contact={contact} {...trustPublicKeyModalProps} />}
        </Banner>
    );
};

export default ExtraPinKey;
