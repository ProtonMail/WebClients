import PropTypes from 'prop-types';

import { classnames } from '../../helpers';

const Bordered = ({ children, className = '', ...rest }) => {
    return (
        <div className={classnames(['border p-4 mb-4', className])} {...rest}>
            {children}
        </div>
    );
};

Bordered.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Bordered;
