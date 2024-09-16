import PropTypes from 'prop-types';
import { c } from 'ttag';

import CircularProgress from '@proton/components/components/progress/CircularProgress';

import { Tooltip } from '../../../components';

const LoadIndicator = ({ server: { Load = 0 } }) => {
    // 1-49% load is GREEN color #5db039
    // 50-89% load is YELLOW color #eac819
    // 90-100% load is RED color #ec5858
    const className = Load < 50 ? '' : Load < 90 ? 'circle-bar--medium' : 'circle-bar--full';
    return (
        <span className="min-w-custom hidden md:inline" style={{ '--min-w-custom': '5em' }}>
            <Tooltip title={c('Info').t`Server load`}>
                <div className="flex inline-flex *:self-center">
                    <CircularProgress progress={Load} size={22} className={className}>
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
