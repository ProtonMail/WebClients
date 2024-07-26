import { c } from 'ttag';

import { Button, Kbd } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import LoadRemoteImageBanner from '@proton/components/containers/banner/LoadRemoteImageBanner';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { hasShowEmbedded, hasShowRemote } from '@proton/shared/lib/mail/images';

import { hasToSkipProxy } from '../../../helpers/message/messageRemotes';
import type { MessageImages } from '../../../store/messages/messagesTypes';

interface Props {
    messageImages?: MessageImages;
    type: string;
    onLoadImages: () => void;
    mailSettings: MailSettings;
}

const ExtraImages = ({ messageImages, type, onLoadImages, mailSettings }: Props) => {
    const { Shortcuts } = mailSettings;

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
        ? c('Action').t`Tracker protection prevented some images from loading. Load them if you trust the sender.`
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
                    className="inline-flex items-center w-full md:w-auto justify-center md:justify-start mr-0 md:mr-0 mb-3 px-2"
                >
                    <Icon name="image" className="shrink-0 ml-1" />
                    <span className="ml-2">{actionText}</span>
                </Button>
            </Tooltip>
        );
    }

    return (
        <LoadRemoteImageBanner
            onClick={onLoadImages}
            actionText={actionText}
            text={text}
            tooltip={tooltip}
            couldLoadDirect={couldLoadDirect}
        />
    );
};

export default ExtraImages;
