import { updatePromptPin } from 'proton-shared/lib/api/mailSettings';
import { normalizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { Address, MailSettings } from 'proton-shared/lib/interfaces';
import { ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { isInternal } from 'proton-shared/lib/mail/messages';
import React, { useMemo } from 'react';
import {
    Button,
    classnames,
    Icon,
    InlineLinkButton,
    LearnMore,
    useAddresses,
    useApi,
    useEventManager,
    useLoading,
    useMailSettings,
    useModals,
    useNotifications,
} from 'react-components';
import { c } from 'ttag';
import { useContactCache } from '../../../containers/ContactProvider';
import { getContactEmail } from '../../../helpers/addresses';
import { MessageVerification } from '../../../models/message';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';

const { SIGNED_AND_INVALID } = VERIFICATION_STATUS;

enum PROMPT_KEY_PINNING_TYPE {
    AUTOPROMPT = 1,
    PIN_UNSEEN,
    PIN_ATTACHED_SIGNING,
    PIN_ATTACHED,
}

interface Params {
    messageVerification: MessageVerification | undefined;
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
    if (addresses.find(({ Email }) => normalizeInternalEmail(Email) === normalizeInternalEmail(senderAddress))) {
        // Do not pin keys for own addresses
        return undefined;
    }
    const { PromptPin } = mailSettings;
    const senderHasPinnedKeys = !!messageVerification?.senderPinnedKeys?.length;
    const firstAttachedPublicKey = messageVerification?.attachedPublicKeys?.length
        ? messageVerification.attachedPublicKeys[0]
        : undefined;
    const isSignedByAttachedKey =
        !!messageVerification?.signingPublicKey &&
        messageVerification?.attachedPublicKeys
            ?.map((key) => key.armor())
            .includes(messageVerification.signingPublicKey?.armor());
    const isAttachedKeyPinned =
        firstAttachedPublicKey &&
        messageVerification?.senderPinnedKeys?.map((key) => key.armor()).includes(firstAttachedPublicKey.armor());

    if (messageVerification?.verificationStatus === SIGNED_AND_INVALID) {
        if (!messageVerification.signingPublicKey) {
            if (firstAttachedPublicKey) {
                return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED;
            }
            return;
        }
        if (senderHasPinnedKeys) {
            return PROMPT_KEY_PINNING_TYPE.PIN_UNSEEN;
        }
        if (isSignedByAttachedKey) {
            return PROMPT_KEY_PINNING_TYPE.PIN_ATTACHED_SIGNING;
        }
        if (PromptPin) {
            return PROMPT_KEY_PINNING_TYPE.AUTOPROMPT;
        }
    }
    if (messageVerification?.verificationStatus === VERIFICATION_STATUS.NOT_SIGNED) {
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
    message: Message | undefined;
    messageVerification: MessageVerification | undefined;
}

const ExtraPinKey = ({ message, messageVerification }: Props) => {
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();
    const [loadingDisablePromptPin, withLoadingDisablePromptPin] = useLoading();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { contactsMap } = useContactCache();

    const senderAddress = message?.SenderAddress;
    const name = message?.SenderName;
    const isSenderInternal = isInternal(message);
    const messageContactID = message?.Sender?.ContactID;
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
    }, [message, mailSettings, addresses, senderAddress]);
    const isPinUnseen = promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.PIN_UNSEEN;
    const firstAttachedPublicKey = messageVerification?.attachedPublicKeys?.length
        ? messageVerification.attachedPublicKeys[0]
        : undefined;
    const bePinnedPublicKey = messageVerification?.signingPublicKey || firstAttachedPublicKey;
    const loading = loadingDisablePromptPin || !senderAddress || (isPinUnseen && !contactID) || !bePinnedPublicKey;
    const bannerColorClassName = isPinUnseen ? 'bg-global-attention color-black' : 'bg-white-dm';

    if (promptKeyPinningType === undefined) {
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
        const contact: ContactWithBePinnedPublicKey = {
            emailAddress: senderAddress,
            name,
            contactID,
            isInternal: isSenderInternal,
            bePinnedPublicKey,
        };
        return createModal(<TrustPublicKeyModal contact={contact} />);
    };

    return (
        <div
            className={classnames([
                'rounded bordered-container p0-5 mb0-5 flex flex-nowrap flex-items-center flex-spacebetween',
                bannerColorClassName,
            ])}
        >
            <div className="flex flex-nowrap mr1">
                <Icon name="key" className="mtauto mbauto mr0-5 flex-item-noshrink" />
                <div>
                    <span className="mr0-5">{getBannerMessage(promptKeyPinningType)}</span>
                    {promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.AUTOPROMPT ? (
                        <InlineLinkButton
                            className="color-currentColor underline"
                            disabled={loadingDisablePromptPin}
                            onClick={() => withLoadingDisablePromptPin(handleDisablePromptPin())}
                        >
                            {c('Action').t`Never show`}
                        </InlineLinkButton>
                    ) : (
                        <LearnMore
                            className="color-currentColor"
                            url="https://protonmail.com/support/knowledge-base/address-verification/"
                        />
                    )}
                </div>
            </div>
            <span className="flex-items-center flex-item-noshrink">
                <Button onClick={handleTrustKey} disabled={loading}>
                    {c('Action').t`Trust key`}
                </Button>
            </span>
        </div>
    );
};

export default ExtraPinKey;
