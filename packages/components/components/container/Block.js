import PropTypes from 'prop-types';

import clsx from '@proton/utils/clsx';

const Block = ({ children, className = '' }) => {
    return <div className={clsx(['mb-4', className])}>{children}</div>;
};

Block.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Block;
