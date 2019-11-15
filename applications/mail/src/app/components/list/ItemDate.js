import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';

import { getDate } from '../../helpers/element';
import { formatSimpleDate, formatFullDate, formatDistanceToNow } from '../../helpers/date';

const FORMATERS = {
    simple: formatSimpleDate,
    full: formatFullDate,
    distance: formatDistanceToNow
};

// TODO: Update with a setInterval?

const ItemDate = ({ element, className, mode = 'simple' }) => {
    const formater = FORMATERS[mode] || FORMATERS.distance;
    return <span className={classnames(['item-date', className])}>{formater(getDate(element))}</span>;
};

ItemDate.propTypes = {
    element: PropTypes.object.isRequired,
    className: PropTypes.string,
    mode: PropTypes.string
};

export default ItemDate;
