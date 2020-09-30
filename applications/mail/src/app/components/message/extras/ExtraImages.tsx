import React from 'react';
import { Icon, useMailSettings } from 'react-components';
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
    onLoadImages
}: Props) => {
    const [mailSettings] = useMailSettings();

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

    return (
        <div className="bg-white-dm rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="insert-image" className="mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">
                {type === 'remote'
                    ? c('Action').t`This message contains remote content.`
                    : c('Action').t`This message contains embedded images.`}
            </span>
            <button type="button" onClick={onLoadImages} className="underline link">
                {c('Action').t`Load`}
            </button>
        </div>
    );
};

export default ExtraImages;
