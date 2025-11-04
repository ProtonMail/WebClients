import { useEffect } from 'react';

import { useLoading } from '@proton/hooks';

interface Props {
    loadingText: string;
    loadedText: string;
    promise: Promise<any>;
}

const LoadingNotificationContent = ({ loadingText, loadedText, promise }: Props) => {
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        void withLoading(promise);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-0168A9
    }, [promise]);

    if (loading) {
        return <>{loadingText}</>;
    }

    return <>{loadedText}</>;
};

export default LoadingNotificationContent;
