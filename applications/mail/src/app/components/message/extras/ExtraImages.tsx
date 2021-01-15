import React from 'react';
import { Icon, useMailSettings, Tooltip } from 'react-components';
import { c } from 'ttag';

import { hasShowEmbedded, hasShowRemote } from '../../../helpers/settings';
import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
    type: string;
    onLoadImages: () => void;
}

const ExtraImages = ({
    message: { showRemoteImages = true, showEmbeddedImages = true },
    type,
    onLoadImages,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [{ Hotkeys } = { Hotkeys: 0 }] = useMailSettings();

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
                <kbd className="bg-global-altgrey noborder">Shift</kbd> +{' '}
                <kbd className="bg-global-altgrey noborder">C</kbd>
            </>
        ) : (
            <>
                {c('Title').t`Load embedded images`}
                <br />
                <kbd className="bg-global-altgrey noborder">Shift</kbd> +{' '}
                <kbd className="bg-global-altgrey noborder">E</kbd>
            </>
        );

    const loadButton = Hotkeys ? (
        <>
            <Tooltip title={titleButtonLoad} className="flex flex-item-noshrink">
                <button type="button" onClick={onLoadImages} className="underline link">{c('Action').t`Load`}</button>
            </Tooltip>
        </>
    ) : (
        <button type="button" onClick={onLoadImages} className="underline link">{c('Action').t`Load`}</button>
    );

    return (
        <div className="bg-white-dm rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="insert-image" className="mtauto mbauto" />
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
