import PropTypes from 'prop-types';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import CircularProgress from '@proton/components/components/progress/CircularProgress';

/**
 * 1-75% load is GREEN color #5db039
 * 76-90% load is YELLOW color #eac819
 * 91-100% load is RED color #ec5858
 */
const getLoadColorClass = (load) => {
    if (load > 90) {
        return 'circle-bar--full';
    }

    if (load > 75) {
        return 'circle-bar--medium';
    }

    return '';
};

const LoadIndicator = ({ server: { Load = 0 } }) => {
    return (
        <span className="min-w-custom hidden md:inline" style={{ '--min-w-custom': '5em' }}>
            <Tooltip title={c('Info').t`Server load`}>
                <div className="flex inline-flex *:self-center">
                    <CircularProgress progress={Load} size={22} className={getLoadColorClass(Load)}>
                        <g className="circle-chart-info">
                            <rect x="17" y="14" width="1.55" height="9.1" className="circle-chart-percent" />
                            <rect x="17" y="11" width="1.55" height="1.53" className="circle-chart-percent" />
                        </g>
                    </CircularProgress>
                    <div className="ml-2">{Load}%</div>
                </div>
            </Tooltip>
        </span>
    );
};

LoadIndicator.propTypes = {
    server: PropTypes.shape({
        Load: PropTypes.number,
    }),
};

export default LoadIndicator;
