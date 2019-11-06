import { c } from 'ttag';
import { Alert, Loader } from 'react-components';
import PropTypes from 'prop-types';
import React from 'react';

const CalendarCreating = () => {
    return (
        <>
            <Alert>{c('Info').t`Give us a moment while we prepare your calendar.`}</Alert>
            <div className="w50 center">
                <Loader />
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
