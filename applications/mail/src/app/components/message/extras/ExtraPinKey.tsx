import { updatePromptPin } from 'proton-shared/lib/api/mailSettings';
import { normalizeEmail } from 'proton-shared/lib/helpers/string';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { ContactEmail, ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import React, { useMemo } from 'react';
import {
    Button,
    classnames,
    Icon,
    InlineLinkButton,
    LearnMore,
    useApi,
    useContactEmails,
    useEventManager,
    useLoading,
    useMailSettings,
    useModals,
    useNotifications
} from 'react-components';
import { c } from 'ttag';

import { VERIFICATION_STATUS } from '../../../constants';
import { isInternal } from '../../../helpers/message/messages';
import { MessageExtended } from '../../../models/message';

import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';

const { SIGNED_AND_INVALID } = VERIFICATION_STATUS;

enum PROMPT_KEY_PINNING_TYPE {
    AUTOPROMPT = 1,
    PIN_UNSEEN,
    PIN_ATTACHED_SIGNING,
    PIN_ATTACHED
}

const getPromptKeyPinningType = (
    message: MessageExtended,
    mailSettings: MailSettings
): PROMPT_KEY_PINNING_TYPE | undefined => {
    const { PromptPin } = mailSettings;
    const senderHasPinnedKeys = !!message.senderPinnedKeys?.length;
    const hasAttachedKeys = !!message.attachedPublicKeys?.length;
    const isSignedByAttachedKey =
        !!message.signingPublicKey &&
        message.attachedPublicKeys?.map((key) => key.armor()).includes(message.signingPublicKey?.armor());

    if (message.verificationStatus === SIGNED_AND_INVALID) {
        if (!message.signingPublicKey) {
            if (hasAttachedKeys) {
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
    if (message.verificationStatus === VERIFICATION_STATUS.NOT_SIGNED) {
        if (!hasAttachedKeys) {
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
    message: MessageExtended;
    onTrustKey: () => void;
}
const ExtraPinKey = ({ message, onTrustKey }: Props) => {
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const [contacts = [], loadingContacts] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [loadingDisablePromptPin, withLoadingDisablePromptPin] = useLoading();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const emailAddress = message.data?.Sender?.Address;
    const isSenderInternal = isInternal(message.data);
    const messageContactID = message.data?.Sender?.ContactID;
    const contactID = useMemo<string | undefined>(() => {
        if (messageContactID) {
            return messageContactID;
        }
        if (!emailAddress) {
            return;
        }
        const preferredContact = contacts.find(
            ({ Email }) => normalizeEmail(Email, isSenderInternal) === normalizeEmail(emailAddress, isSenderInternal)
        );
        return preferredContact?.ContactID;
    }, [messageContactID, contacts, emailAddress]);

    const promptKeyPinningType = getPromptKeyPinningType(message, mailSettings);
    const isPinUnseen = promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.PIN_UNSEEN;
    const firstAttachedPublicKey = message.attachedPublicKeys?.length ? message.attachedPublicKeys[0] : undefined;
    const bePinnedPublicKey = message.signingPublicKey || firstAttachedPublicKey;
    const loading =
        loadingContacts ||
        loadingDisablePromptPin ||
        !emailAddress ||
        (isPinUnseen && !contactID) ||
        !bePinnedPublicKey;
    const bannerColorClassName = isPinUnseen ? 'bg-global-attention' : 'bg-global-border';

    if (promptKeyPinningType === undefined) {
        return null;
    }

    const handleDisablePromptPin = async () => {
        await api(updatePromptPin(0));
        await call();
        createNotification({ text: c('Success').t`Banner permanently hidden` });
    };
    const handleTrustKey = () => {
        if (loading || !bePinnedPublicKey) {
            return;
        }
        const contact: ContactWithBePinnedPublicKey = {
            emailAddress: emailAddress as string,
            contactID,
            isInternal: isSenderInternal,
            bePinnedPublicKey
        };
        return createModal(<TrustPublicKeyModal contact={contact} onSubmit={onTrustKey} />);
    };

    return (
        <div
            className={classnames([
                'rounded bordered-container p0-5 mb0-5 flex flex-nowrap flex-items-center flex-spacebetween',
                bannerColorClassName
            ])}
        >
            <div className="flex flex-nowrap mr1">
                {<Icon name="key" className="mtauto mbauto mr0-5 flex-item-noshrink" />}
                <div>
                    <span className="mr0-5">{getBannerMessage(promptKeyPinningType)}</span>
                    {promptKeyPinningType === PROMPT_KEY_PINNING_TYPE.AUTOPROMPT ? (
                        <InlineLinkButton
                            className="underline"
                            disabled={loadingDisablePromptPin}
                            onClick={() => withLoadingDisablePromptPin(handleDisablePromptPin())}
                        >
                            {c('Action').t`Never show`}
                        </InlineLinkButton>
                    ) : (
                        <LearnMore url="https://protonmail.com/support/knowledge-base/address-verification/" />
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
