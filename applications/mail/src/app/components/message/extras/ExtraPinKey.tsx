import { useMemo } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import {
    Icon,
    InlineLinkButton,
    useAddresses,
    useApi,
    useEventManager,
    useMailSettings,
    useModalState,
    useNotifications,
} from '@proton/components';
import { PublicKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, MailSettings } from '@proton/shared/lib/interfaces';
import { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { isInternal } from '@proton/shared/lib/mail/messages';

import { getContactEmail } from '../../../helpers/message/messageRecipients';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { MessageVerification, MessageWithOptionalBody } from '../../../logic/messages/messagesTypes';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';

const { NOT_VERIFIED, SIGNED_AND_INVALID } = VERIFICATION_STATUS;

enum PROMPT_KEY_PINNING_TYPE {
    AUTOPROMPT = 1,
    PIN_UNSEEN,
    PIN_ATTACHED_SIGNING,
    PIN_ATTACHED,
}

interface Params {
    messageVerification: MessageVerification;
    mailSettings?: Partial<MailSettings>;
    addresses: Address[];
    senderAddress: string;
}

const getPromptKeyPinningType = ({
    messageVerification,
    mailSettings = {},
    addresses,
    senderAddress,
}: Params): PROMPT_KEY_PINNING_TYPE | undefined => {
    if (addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(senderAddress))) {
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

    if (verificationStatus === SIGNED_AND_INVALID || verificationStatus === NOT_VERIFIED) {
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
    if (verificationStatus === VERIFICATION_STATUS.NOT_SIGNED) {
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
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();
    const [loadingDisablePromptPin, withLoadingDisablePromptPin] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
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
        await api(updatePromptPin(0));
        await call();
        createNotification({ text: c('Success').t`Address verification disabled` });
    };
    const handleTrustKey = () => {
        if (loading || !bePinnedPublicKey || !senderAddress) {
            return;
        }
        setTrustPublicKeyModalOpen(true);
    };

    return (
        <div
            className="bg-norm rounded border pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap flex-justify-space-between on-mobile-flex-column"
            data-testid="extra-pin-key:banner"
        >
            <div className="flex flex-nowrap pr-4 mb-2 md:mb-0">
                <Icon name="exclamation-circle-filled" className="mt-1 mr-2 ml-0.5 flex-item-noshrink color-danger" />
                <div>
                    <span className="pr-2 flex flex-item-fluid mt-1">
                        <span className="mr-1" data-testid="extra-pin-key:content">
                            {getBannerMessage(promptKeyPinningType)}
                        </span>
                        {promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.AUTOPROMPT ? (
                            <InlineLinkButton
                                disabled={loadingDisablePromptPin}
                                onClick={() => withLoadingDisablePromptPin(handleDisablePromptPin())}
                            >
                                {c('Action').t`Never show`}
                            </InlineLinkButton>
                        ) : (
                            <Href href={getKnowledgeBaseUrl('/address-verification')}>{c('Link').t`Learn more`}</Href>
                        )}
                    </span>
                </div>
            </div>
            <span className="flex-align-items-start flex-item-noshrink on-mobile-w100 pt-0.5">
                <Button
                    size="small"
                    color="weak"
                    shape="outline"
                    fullWidth
                    className="rounded-sm"
                    onClick={handleTrustKey}
                    disabled={loading}
                    data-testid="extra-pin-key:trust-button"
                >
                    {c('Action').t`Trust key`}
                </Button>
            </span>

            {renderTrustPublicKeyModal && <TrustPublicKeyModal contact={contact} {...trustPublicKeyModalProps} />}
        </div>
    );
};

export default ExtraPinKey;
