import React from 'react';
import PropTypes from 'prop-types';
import { Icon, LinkButton } from 'react-components';
import { c } from 'ttag';

const ExtraImages = ({ message: { showRemoteImages, showEmbeddedImages }, type, onLoadImages }) => {
    // Flags will not be setted if there is no images
    if ((type === 'remote' && showRemoteImages !== false) || (type === 'embedded' && showEmbeddedImages !== false)) {
        return null;
    }

    return (
        <div className="bg-white w100 rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="insert-image" className="flex-item-noshrink fill-global-grey mtauto mbauto" />
            <span className="w100 flex flex-wrap">
                <span className="pl0-5 pr0-5 mtauto mbauto flex-item-fluid-auto">
                    {type === 'remote'
                        ? c('Action').t`This message contains remote content`
                        : c('Action').t`This message contains embedded images`}
                </span>
                <span className="flex-item-noshrink flex">
                    <LinkButton onClick={onLoadImages} className="link pl0-5 pr0-5 bold">
                        {c('Action').t`Load`}
                    </LinkButton>
                </span>
            </span>
        </div>
    );
};

ExtraImages.propTypes = {
    message: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    onLoadImages: PropTypes.func.isRequired
};

export default ExtraImages;
