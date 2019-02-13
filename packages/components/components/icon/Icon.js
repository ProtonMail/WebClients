import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Icon = ({ name, type, alt, ...rest }) => {
    if (type === 'svg') {
        return <svg></svg>;
    }

    if (type === 'class') {
        return <i className={getClasses('fa', name)} {...rest} />;
    }

    if (type === 'src') {
        return <img src={name} alt={alt} {...rest} />;
    }

    return null;
};

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['svg', 'class', 'src']),
    alt: PropTypes.string
};

Icon.defaultProps = {
    type: 'svg',
    alt: ''
};

export default Icon;