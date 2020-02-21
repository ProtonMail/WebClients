import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';
import Icon from '../icon/Icon';

const DropdownCaret = ({ className, isOpen }) => {
    return <Icon className={classnames([isOpen && 'rotateX-180', className])} size={12} name="caret" />;
};

DropdownCaret.propTypes = {
    className: PropTypes.string,
    isOpen: PropTypes.bool
};

export default DropdownCaret;
