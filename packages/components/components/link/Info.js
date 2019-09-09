import React from 'react';
import PropTypes from 'prop-types';

import Href from './Href';
import Icon from '../icon/Icon';
import Tooltip from '../tooltip/Tooltip';

const wrapTooltip = (children, title) => <Tooltip title={title}>{children}</Tooltip>;
const wrapLink = (children, url) => <Href url={url}>{children}</Href>;

const Info = ({ url, title, ...rest }) => {
    let children = <Icon className="icon-16p fill-primary" name="info" {...rest} />;

    if (url) {
        children = wrapLink(children, url);
    }

    if (title) {
        children = wrapTooltip(children, title);
    }

    return children;
};

Info.propTypes = {
    url: PropTypes.string,
    title: PropTypes.node
};

export default Info;
