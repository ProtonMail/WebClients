import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-components';
import { c } from 'ttag';

const LoadIndicator = ({ server: { Load = 0 } }) => {
    // 1-49% load is GREEN color #5db039
    // 50-89% load is YELLOW color #eac819
    // 90-100% load is RED color #ec5858
    const background = Load < 50 ? '#5db039' : Load < 90 ? '#eac819' : '#ec5858';
    return (
        <span className="min-w5e nomobile">
            <Tooltip title={c('Info').t`Server load`}>
                <div className="flex inline-flex-vcenter">
                    <div className="load-indicator">
                        <div className="load-indicator-overlay" style={{ background }}></div>
                    </div>
                    <div className="ml0-5">{Load}%</div>
                </div>
            </Tooltip>
        </span>
    );
};

LoadIndicator.propTypes = {
    server: PropTypes.shape({
        Load: PropTypes.number
    })
};

export default LoadIndicator;
