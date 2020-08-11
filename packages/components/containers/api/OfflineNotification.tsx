import { c } from 'ttag';
import React from 'react';
import { LinkButton, useLoading } from '../../index';

interface Props {
    onRetry: () => Promise<void>;
    message?: string;
}
const OfflineNotification = ({ onRetry, message }: Props) => {
    const [loading, withLoading] = useLoading();
    const retryNow = (
        <LinkButton className="alignbaseline p0" disabled={loading} onClick={() => withLoading(onRetry())}>
            {c('Action').t`Retry now`}
        </LinkButton>
    );
    return (
        <>
            {message || c('Error').t`Servers are unreachable.`} {retryNow}
        </>
    );
};

export default OfflineNotification;
