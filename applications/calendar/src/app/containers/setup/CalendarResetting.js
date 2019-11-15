import { c } from 'ttag';
import { Alert, Loader } from 'react-components';
import PropTypes from 'prop-types';
import React from 'react';

const CalendarResetting = () => {
    return (
        <>
            <Alert>{c('Info').t`Give us a moment while we reset your calendar.`}</Alert>
            <div className="aligncenter">
                <Loader size="medium" />
                <p>{c('Info').t`Resetting your calendar...`}</p>
            </div>
        </>
    );
};

CalendarResetting.propTypes = {
    loading: PropTypes.bool,
    isFree: PropTypes.bool
};

export default CalendarResetting;
