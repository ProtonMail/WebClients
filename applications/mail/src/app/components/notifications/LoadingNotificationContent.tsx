import { useEffect } from 'react';
import { useLoading } from '@proton/components';

interface Props {
    loadingText: string;
    loadedText: string;
    promise: Promise<any>;
}

const LoadingNotificationContent = ({ loadingText, loadedText, promise }: Props) => {
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        withLoading(promise);
    }, [promise]);

    if (loading) {
        return <>{loadingText}</>;
    }

    return <>{loadedText}</>;
};

export default LoadingNotificationContent;
