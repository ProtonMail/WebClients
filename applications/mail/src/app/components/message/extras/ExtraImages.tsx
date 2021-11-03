import { shiftKey } from '@proton/shared/lib/helpers/browser';
import { Icon, useMailSettings, Tooltip } from '@proton/components';
import { c } from 'ttag';

import { hasShowEmbedded, hasShowRemote } from '../../../helpers/mailSettings';
import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
    type: string;
    onLoadImages: () => void;
}

const ExtraImages = ({ message, type, onLoadImages }: Props) => {
    const [mailSettings] = useMailSettings();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const { showRemoteImages = true, showEmbeddedImages = true } = message.messageImages || {};

    if (type === 'embedded' && hasShowEmbedded(mailSettings)) {
        return null;
    }

    if (type === 'embedded' && showEmbeddedImages !== false) {
        return null;
    }

    if (type === 'remote' && hasShowRemote(mailSettings)) {
        return null;
    }

    if (type === 'remote' && showRemoteImages !== false) {
        return null;
    }

    const titleButtonLoad =
        type === 'remote' ? (
            <>
                {c('Title').t`Load remote content`}
                <br />
                <kbd className="no-border">{shiftKey}</kbd> + <kbd className="no-border">C</kbd>
            </>
        ) : (
            <>
                {c('Title').t`Load embedded images`}
                <br />
                <kbd className="no-border">{shiftKey}</kbd> + <kbd className="no-border">E</kbd>
            </>
        );

    const loadButton = Shortcuts ? (
        <>
            <Tooltip title={titleButtonLoad}>
                <button
                    type="button"
                    onClick={onLoadImages}
                    className="flex flex-item-noshrink text-underline link"
                    data-testid="remote-content:load1"
                >{c('Action').t`Load`}</button>
            </Tooltip>
        </>
    ) : (
        <button
            type="button"
            onClick={onLoadImages}
            className="text-underline link"
            data-testid="remote-content:load2"
        >{c('Action').t`Load`}</button>
    );

    return (
        <div className="bg-norm rounded bordered p0-5 mb0-5 flex flex-nowrap">
            <Icon name="image" className="mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">
                {type === 'remote'
                    ? c('Action').t`This message contains remote content.`
                    : c('Action').t`This message contains embedded images.`}
            </span>
            {loadButton}
        </div>
    );
};

export default ExtraImages;
