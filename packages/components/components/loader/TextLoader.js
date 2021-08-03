import PropTypes from 'prop-types';
import EllipsisLoader from './EllipsisLoader';

const TextLoader = ({ children, className }) => {
    return (
        <p className={className}>
            {children}
            <EllipsisLoader />
        </p>
    );
};

TextLoader.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

export default TextLoader;
