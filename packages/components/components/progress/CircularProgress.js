import PropTypes from 'prop-types';
import { classnames } from '../../helpers';

const CircularProgress = ({ children, className, progress, rootRef, size = 32, ...rest }) => {
    return (
        <svg
            ref={rootRef}
            viewBox="0 0 35.83098862 35.83098862"
            className={classnames(['circle-chart', className])}
            width={size}
            height={size}
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
        >
            <circle
                className="circle-chart-background"
                strokeDasharray="100, 100"
                cx="17.91549431"
                cy="17.91549431"
                r="15.91549431"
            />
            <circle
                className="circle-chart-circle"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="butt"
                cx="17.91549431"
                cy="17.91549431"
                r="15.91549431"
            />
            {children}
        </svg>
    );
};

CircularProgress.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    rootRef: PropTypes.object,
    size: PropTypes.number,
    progress: PropTypes.number.isRequired,
};

export default CircularProgress;
