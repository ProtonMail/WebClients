import { c } from 'ttag';
import { Alert, FullLoader } from 'react-components';
import PropTypes from 'prop-types';
import React from 'react';

const CalendarCreating = () => {
    return (
        <>
            <Alert>{c('Info').t`Give us a moment while we prepare your calendar.`}</Alert>
            <div className="aligncenter">
                <FullLoader size={80} className="center flex color-primary" />
                <p>{c('Info').t`Creating your calendar...`}</p>
            </div>
        </>
    );
};

CalendarCreating.propTypes = {
    loading: PropTypes.bool,
    isFree: PropTypes.bool
};

export default CalendarCreating;
