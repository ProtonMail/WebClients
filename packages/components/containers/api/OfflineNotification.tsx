import { c } from 'ttag';
import { LinkButton } from '../../components';
import { useLoading } from '../../hooks';

interface Props {
    onRetry: () => Promise<void>;
    message?: string;
}
const OfflineNotification = ({ onRetry, message }: Props) => {
    const [loading, withLoading] = useLoading();
    const retryNow = (
        <LinkButton className="align-baseline p0" disabled={loading} onClick={() => withLoading(onRetry())}>
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
