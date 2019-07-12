import { c } from 'ttag';
import PropTypes from 'prop-types';
import React from 'react';
import { Badge, LoaderIcon } from 'react-components';

export const STATUS = {
    QUEUED: 0,
    DONE: 1,
    FAILURE: 2,
    LOADING: 3
};

const Status = ({ type, tooltip }) => {
    if (type === STATUS.QUEUED) {
        return <Badge type="default">{c('Info').t`Queued`}</Badge>;
    }

    if (type === STATUS.DONE) {
        return <Badge type="success">{c('Info').t`Done`}</Badge>;
    }

    if (type === STATUS.FAILURE) {
        return <Badge type="error" tooltip={tooltip}>{c('Error').t`Error`}</Badge>;
    }

    if (type === STATUS.LOADING) {
        return <LoaderIcon />;
    }
    return null;
};

Status.propTypes = {
    type: PropTypes.number,
    tooltip: PropTypes.string
};

export default Status;
