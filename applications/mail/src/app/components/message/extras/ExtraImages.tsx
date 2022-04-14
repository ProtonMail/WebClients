import { c } from 'ttag';
import { Icon, Tooltip, Button } from '@proton/components';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
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
        ? c('Action').t`No trackers found, but some images could not be loaded with tracking protection.`
        : c('Action').t`This message contains remote content.`;

    const embeddedText = c('Action').t`This message contains embedded images.`;

    const text = type === 'remote' ? remoteText : embeddedText;

    const actionText = couldLoadDirect
        ? c('Action').t`Load unprotected`
        : type === 'embedded'
        ? c('Action').t`Load embedded images`
        : c('Action').t`Load`;

    const tooltipText = couldLoadDirect
        ? c('Action').t`Images will be loaded without a proxy`
        : type === 'remote'
        ? c('Title').t`Load remote content`
        : c('Title').t`Load embedded images`;

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
                    className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 on-mobile-mr0 mb0-85 px0-5"
                >
                    <Icon name={couldLoadDirect ? 'shield' : 'image'} className="flex-item-noshrink ml0-25" />
                    <span className="ml0-5">{actionText}</span>
                </Button>
            </Tooltip>
        );
    }

    return (
        <div className="bg-norm rounded border px0-5 py0-25 mb0-85 flex flex-nowrap on-mobile-flex-column">
            <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5">
                <Icon name={couldLoadDirect ? 'shield' : 'image'} className="mt0-3 flex-item-noshrink ml0-2" />
                <span className="pl0-5 pr0-5 flex flex-item-fluid flex-align-items-center">{text}</span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100 pt0-1">
                <Tooltip title={tooltip}>
                    <Button
                        onClick={onLoadImages}
                        size="small"
                        color="weak"
                        shape="outline"
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
