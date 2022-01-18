import { c } from 'ttag';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
import { Icon, Tooltip } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { hasShowEmbedded, hasShowRemote } from '../../../helpers/mailSettings';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { hasToSkipProxy } from '../../../helpers/message/messageRemotes';

interface Props {
    message: MessageState;
    type: string;
    onLoadImages: () => void;
    mailSettings?: MailSettings;
}

const ExtraImages = ({ message, type, onLoadImages, mailSettings }: Props) => {
    const { Shortcuts = 0 } = mailSettings || {};

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

    const remoteText = couldLoadDirect
        ? c('Action').t`Some images could not be loaded with tracking protection`
        : c('Action').t`This message contains remote content.`;

    const embeddedText = c('Action').t`This message contains embedded images.`;

    const text = type === 'remote' ? remoteText : embeddedText;

    const actionText = couldLoadDirect ? c('Action').t`Load unprotected` : c('Action').t`Load`;

    const tooltipText = type === 'remote' ? c('Title').t`Load remote content` : c('Title').t`Load embedded images`;

    const tooltip = Shortcuts ? (
        <>
            {tooltipText}
            <br />
            <kbd className="border-none">{shiftKey}</kbd> + <kbd className="border-none">C</kbd>
        </>
    ) : undefined;

    return (
        <div className="bg-norm rounded border p0-5 mb0-5 flex flex-nowrap">
            <Icon name="image" className="mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{text}</span>
            <Tooltip title={tooltip}>
                <button
                    type="button"
                    onClick={onLoadImages}
                    className="flex flex-item-noshrink text-underline link"
                    data-testid="remote-content:load"
                >
                    {actionText}
                </button>
            </Tooltip>
        </div>
    );
};

export default ExtraImages;
