import { c } from 'ttag';
import React from 'react';
import { LinkButton, useLoading } from 'react-components';
import PropTypes from 'prop-types';

const OfflineNotification = ({ onRetry }) => {
    const [loading, withLoading] = useLoading();
    const retryNow = (
        <LinkButton className="alignbaseline p0" disabled={loading} onClick={() => withLoading(onRetry())}>
            {c('Action').t`Retry now`}
        </LinkButton>
    );
    return (
        <>
            {c('Error').t`Servers are unreachable.`} {retryNow}
        </>
    );
};

OfflineNotification.propTypes = {
    onRetry: PropTypes.func,
};

export default OfflineNotification;
