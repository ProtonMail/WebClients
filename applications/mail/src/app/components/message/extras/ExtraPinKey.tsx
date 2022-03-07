import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Address, MailSettings } from '@proton/shared/lib/interfaces';
import { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { isInternal } from '@proton/shared/lib/mail/messages';
import { useMemo } from 'react';
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
} from '@proton/components';
import { c } from 'ttag';
import { getContactEmail } from '../../../helpers/addresses';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';
import { MessageVerification } from '../../../logic/messages/messagesTypes';
import { useContactsMap } from '../../../hooks/contact/useContacts';

const { NOT_VERIFIED, SIGNED_AND_INVALID } = VERIFICATION_STATUS;

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
    if (addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonizeInternalEmail(senderAddress))) {
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

    if (
        messageVerification?.verificationStatus === SIGNED_AND_INVALID ||
        messageVerification?.verificationStatus === NOT_VERIFIED
    ) {
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
    const contactsMap = useContactsMap();

    const senderAddress = message?.Sender.Address;
    const name = message?.Sender.Name;
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
    const bannerColorClassName = isPinUnseen ? 'bg-warning' : 'bg-norm';

    // Prevent to propose an already pinned key even if for a strange reason,
    // the suggested key is already pinned yet the verification still fails
    const signingPublicKeyAlreadyPinned = messageVerification?.senderPinnedKeys?.some(
        (pinKey) => pinKey.armor() === bePinnedPublicKey?.armor()
    );

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
        const contact: ContactWithBePinnedPublicKey = {
            emailAddress: senderAddress,
            name,
            contactID,
            isInternal: isSenderInternal,
            bePinnedPublicKey,
        };
        createModal(<TrustPublicKeyModal contact={contact} />);
    };

    return (
        <div
            className={classnames([
                'rounded border p0-5 mb0-85 flex flex-nowrap flex-justify-space-between on-mobile-flex-column',
                bannerColorClassName,
            ])}
        >
            <div className="flex flex-nowrap pr1 on-mobile-mb0-5">
                <Icon name="circle-exclamation-filled" className="mt0-5 mr0-5 flex-item-noshrink color-danger" />
                <div>
                    <span className="pr0-5 flex flex-item-fluid mt0-25">
                        <span className="mr0-25">{getBannerMessage(promptKeyPinningType)}</span>
                        {promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.AUTOPROMPT ? (
                            <InlineLinkButton
                                className="color-inherit text-underline"
                                disabled={loadingDisablePromptPin}
                                onClick={() => withLoadingDisablePromptPin(handleDisablePromptPin())}
                            >
                                {c('Action').t`Never show`}
                            </InlineLinkButton>
                        ) : (
                            <LearnMore
                                className="color-inherit"
                                url="https://protonmail.com/support/knowledge-base/address-verification/"
                            />
                        )}
                    </span>
                </div>
            </div>
            <span className="flex-align-items-start flex-item-noshrink on-mobile-w100 pt0-1">
                <Button size="small" className="on-mobile-w100 py0-25" onClick={handleTrustKey} disabled={loading}>
                    {c('Action').t`Trust key`}
                </Button>
            </span>
        </div>
    );
};

export default ExtraPinKey;
