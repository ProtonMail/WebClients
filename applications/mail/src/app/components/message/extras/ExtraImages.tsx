import { c } from 'ttag';
import { Icon, Tooltip, Button, useApi, useNotifications, InlineLinkButton } from '@proton/components';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { updateShowImages } from '@proton/shared/lib/api/mailSettings';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { hasShowEmbedded, hasShowRemote } from '../../../helpers/mailSettings';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { hasToSkipProxy } from '../../../helpers/message/messageRemotes';

const { REMOTE } = SHOW_IMAGES;

interface Props {
    message: MessageState;
    type: string;
    onLoadImages: () => void;
    mailSettings?: MailSettings;
    call?: () => Promise<void>;
    isOutside?: boolean;
}

const ExtraImages = ({ message, type, onLoadImages, mailSettings, call, isOutside = false }: Props) => {
    const { Shortcuts = 0 } = mailSettings || {};
    const { createNotification } = useNotifications();
    const api = useApi();

    const { showRemoteImages = true, showEmbeddedImages = true } = message.messageImages || {};

    const couldLoadDirect =
        type === 'remote' && showRemoteImages === true && hasToSkipProxy(message.messageImages?.images);

    if (type === 'embedded' && hasShowEmbedded(mailSettings)) {
        return null;
    }

    if (type === 'embedded' && showEmbeddedImages !== false) {
        return null;
    }

    if (type === 'remote' && hasShowRemote(mailSettings) && !couldLoadDirect) {
        return null;
    }

    if (type === 'remote' && showRemoteImages !== false && !couldLoadDirect) {
        return null;
    }

    const handleTurnAutoLoad = async () => {
        onLoadImages();
        const bit = setBit(mailSettings?.ShowImages, REMOTE);

        await api(updateShowImages(bit));
        await call?.();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const remoteText = couldLoadDirect
        ? c('Action').t`Some images could not be loaded with tracking protection`
        : c('Action').t`This message contains remote content.`;

    const embeddedText = c('Action').t`This message contains embedded images.`;

    const text = type === 'remote' ? remoteText : embeddedText;

    const actionText = couldLoadDirect
        ? c('Action').t`Load unprotected`
        : type === 'embedded'
        ? c('Action').t`Load embedded images`
        : c('Action').t`Load`;

    const tooltipText = type === 'remote' ? c('Title').t`Load remote content` : c('Title').t`Load embedded images`;

    const tooltip = Shortcuts ? (
        <>
            {tooltipText}
            <br />
            <kbd className="border-none">{shiftKey}</kbd> + <kbd className="border-none">C</kbd>
        </>
    ) : undefined;

    if (type === 'embedded') {
        return (
            <Tooltip title={text}>
                <Button
                    onClick={onLoadImages}
                    data-testid="remote-content:load"
                    size="small"
                    className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 mb0-85 py0-25"
                >
                    <Icon name="image" className="flex-item-noshrink" />
                    <span className="ml0-5">{actionText}</span>
                </Button>
            </Tooltip>
        );
    }

    return (
        <div className="bg-norm rounded border p0-5 mb0-85 flex flex-nowrap on-mobile-flex-column">
            <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5">
                <Icon name="image" className="mt0-5 flex-item-noshrink" />
                <span className="pl0-5 pr0-5 flex flex-item-fluid mt0-25 flex-align-items-center">
                    <span className="mr0-5">{text}</span>
                    {!isOutside && !couldLoadDirect && (
                        <InlineLinkButton className="text-left" color="norm" onClick={handleTurnAutoLoad}>
                            {c('Action').t`Turn on auto-load`}
                        </InlineLinkButton>
                    )}
                </span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100 pt0-1">
                <Tooltip title={tooltip}>
                    <Button
                        onClick={onLoadImages}
                        size="small"
                        className="on-mobile-w100 py0-25"
                        data-testid="remote-content:load"
                    >
                        {actionText}
                    </Button>
                </Tooltip>
            </span>
        </div>
    );
};

export default ExtraImages;
