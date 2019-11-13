import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';
import { c } from 'ttag';

const ExtraImages = ({ message: { showRemoteImages, showEmbeddedImages }, type, onLoadImages }) => {
    // Flags will not be setted if there is no images
    if ((type === 'remote' && showRemoteImages !== false) || (type === 'embedded' && showEmbeddedImages !== false)) {
        return null;
    }

    return (
        <div className="bg-white rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="insert-image" className="fill-global-grey mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">
                {type === 'remote'
                    ? c('Action').t`This message contains remote content`
                    : c('Action').t`This message contains embedded images`}
            </span>
            <a onClick={onLoadImages} className="bold">
                {c('Action').t`Load`}
            </a>
        </div>
    );
};

ExtraImages.propTypes = {
    message: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    onLoadImages: PropTypes.func.isRequired
};

export default ExtraImages;
