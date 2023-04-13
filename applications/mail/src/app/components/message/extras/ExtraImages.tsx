import { c } from 'ttag';

import { Button, Kbd } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { hasShowEmbedded, hasShowRemote } from '@proton/shared/lib/mail/images';

import { hasToSkipProxy } from '../../../helpers/message/messageRemotes';
import { MessageImages } from '../../../logic/messages/messagesTypes';

interface Props {
    messageImages?: MessageImages;
    type: string;
    onLoadImages: () => void;
    mailSettings?: MailSettings;
}

const ExtraImages = ({ messageImages, type, onLoadImages, mailSettings }: Props) => {
    const { Shortcuts = 0 } = mailSettings || {};

    const { showRemoteImages = true, showEmbeddedImages = true } = messageImages || {};

    const couldLoadDirect = type === 'remote' && showRemoteImages === true && hasToSkipProxy(messageImages?.images);

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
        ? c('Action').t`Some images could not be loaded with tracker protection.`
        : c('Action').t`This message contains remote content.`;

    const embeddedText = c('Action').t`This message contains embedded images.`;

    const text = type === 'remote' ? remoteText : embeddedText;

    const actionText = type === 'embedded' ? c('Action').t`Load embedded images` : c('Action').t`Load`;

    const tooltipText = couldLoadDirect
        ? c('Action').t`Images will be loaded without a proxy`
        : type === 'remote'
        ? c('Title').t`Load remote content`
        : c('Title').t`Load embedded images`;

    const tooltip = Shortcuts ? (
        <>
            {tooltipText}
            <br />
            <Kbd shortcut={shiftKey} /> + <Kbd shortcut="C" />
        </>
    ) : undefined;

    if (type === 'embedded') {
        return (
            <Tooltip title={text}>
                <Button
                    onClick={onLoadImages}
                    data-testid="embedded-content:load"
                    className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 on-mobile-mr0 mb0-85 px0-5"
                >
                    <Icon name="image" className="flex-item-noshrink ml0-25" />
                    <span className="ml0-5">{actionText}</span>
                </Button>
            </Tooltip>
        );
    }

    return (
        <div className="bg-norm rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 on-mobile-w100 py0-25 mb0-85 flex flex-nowrap on-mobile-flex-column">
            <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5">
                <Icon name={couldLoadDirect ? 'info-circle' : 'image'} className="mt0-4 flex-item-noshrink ml0-2" />
                <span className="pl0-5 pr0-5 flex flex-item-fluid flex-align-items-center">{text}</span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100 pt0-1">
                <Tooltip title={tooltip}>
                    <Button
                        onClick={onLoadImages}
                        size="small"
                        color="weak"
                        shape="outline"
                        fullWidth
                        className="rounded-sm"
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
