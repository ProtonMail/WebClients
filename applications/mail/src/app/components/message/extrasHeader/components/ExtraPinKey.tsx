import { useMemo } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Banner, Button, Href, InlineLinkButton } from '@proton/atoms';
import { Icon, useApi, useModalState, useNotifications } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import type { MessageVerification, MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { useDispatch } from '@proton/redux-shared-store';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, MailSettings } from '@proton/shared/lib/interfaces';
import type { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { PROMPT_PIN } from '@proton/shared/lib/mail/mailSettings';
import { isInternal } from '@proton/shared/lib/mail/messages';

import useMailModel from 'proton-mail/hooks/useMailModel';

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

const getPromptKeyPinningType = ({
    messageVerification,
    mailSettings,
    addresses,
    senderAddress,
}: Params): PROMPT_KEY_PINNING_TYPE | undefined => {
    if (addresses?.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(senderAddress))) {
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
    const senderHasPinnedKeys = !!senderPinnedKeys.length;
    const firstAttachedPublicKey = attachedPublicKeys.length ? attachedPublicKeys[0] : undefined;
    const isSignedByAttachedKey =
        !!signingPublicKey && attachedPublicKeys?.some((key) => signingPublicKey?.equals(key));
    const isAttachedKeyPinned =
        firstAttachedPublicKey && senderPinnedKeys.some((key) => firstAttachedPublicKey.equals(key));

    if (
        verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID ||
        verificationStatus === MAIL_VERIFICATION_STATUS.NOT_VERIFIED
    ) {
        if (!signingPublicKey) {
            if (firstAttachedPublicKey) {
                return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED;
            }
            return;
        }
        const signingFingerprint = signingPublicKey.getFingerprint();
        if (senderHasPinnedKeys) {
            if (senderPinnableKeys.find((key) => key.getFingerprint() === signingFingerprint)) {
                // TODO: Exclude case where signature is invalid due to message modification (cf. OpenPGP.js v5)
                return PROMPT_KEY_PINNING_TYPE.PIN_UNSEEN;
            } else {
                return;
            }
        }
        if (isSignedByAttachedKey) {
            return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED_SIGNING;
        }
        if (PromptPin) {
            return PROMPT_KEY_PINNING_TYPE.AUTOPROMPT;
        }
    }
    if (verificationStatus === MAIL_VERIFICATION_STATUS.NOT_SIGNED) {
        if (!firstAttachedPublicKey || isAttachedKeyPinned) {
            return;
        }
        return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED;
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
        return c('Info').t`An unknown public key has been detected for this recipient.`;
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
    const mailSettings = useMailModel('MailSettings');
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
    const firstAttachedPublicKey = messageVerification?.attachedPublicKeys?.length
        ? messageVerification.attachedPublicKeys[0]
        : undefined;
    const bePinnedPublicKey = messageVerification?.signingPublicKey || firstAttachedPublicKey;
    const loading = loadingDisablePromptPin || !senderAddress || (isPinUnseen && !contactID) || !bePinnedPublicKey;

    // Prevent to propose an already pinned key even if for a strange reason,
    // the suggested key is already pinned yet the verification still fails
    const signingPublicKeyAlreadyPinned = messageVerification?.senderPinnedKeys?.some((pinKey) =>
        bePinnedPublicKey?.equals(pinKey)
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
            icon={<Icon name="exclamation-triangle-filled" className="color-danger" />}
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
