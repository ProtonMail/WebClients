import PropTypes from 'prop-types';
import { classnames } from '../../helpers';

const Paragraph = ({ className = '', children }) => {
    return <div className={classnames(['pt1 pb1', className])}>{children}</div>;
};

Paragraph.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export default Paragraph;
