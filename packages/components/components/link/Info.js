import React from 'react';
import PropTypes from 'prop-types';

import Href from './Href';
import Icon from '../icon/Icon';

const Info = ({ url }) => {
    return (
        <Href url={url}>
            <Icon name="info" />
        </Href>
    );
};

Info.propTypes = {
    url: PropTypes.string.isRequired
};

export default Info;
