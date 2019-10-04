import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const Preformatted = ({ className = '', ...rest }) => {
    return <pre className={classnames(['bg-global-muted p1 mb1 scroll-if-needed', className])} {...rest} />;
};

Preformatted.propTypes = {
    className: PropTypes.string
};

export default Preformatted;
