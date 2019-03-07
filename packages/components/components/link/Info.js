import React from 'react';
import PropTypes from 'prop-types';

import Href from './Href';
import Icon from '../icon/Icon';
import Tooltip from '../tooltip/Tooltip';

const Info = ({ url, tooltip, title }) => {
    if (url) {
        return (
            <Href url={url} title={title}>
                <Icon name="info" />
            </Href>
        );
    }

    if (tooltip) {
        return (
            <Tooltip title={tooltip}>
                <Icon name="info" />
            </Tooltip>
        );
    }

    return null;
};

Info.propTypes = {
    url: PropTypes.string,
    tooltip: PropTypes.string,
    title: PropTypes.string
};

export default Info;
