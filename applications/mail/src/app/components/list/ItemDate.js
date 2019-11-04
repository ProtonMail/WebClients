import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';

import { ELEMENT_TYPES } from '../../constants';
import { getReadableTime, getReadableFullTime } from '../../helpers/element';

const ItemDate = ({ element, className, showDetails = false }) => {
    const readableDate = showDetails ? getReadableFullTime(element) : getReadableTime(element);
    return <span className={classnames(['item-date', className])}>{readableDate}</span>;
};

ItemDate.propTypes = {
    element: PropTypes.object.isRequired,
    className: PropTypes.string,
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired,
    showDetails: PropTypes.bool
};

export default ItemDate;
