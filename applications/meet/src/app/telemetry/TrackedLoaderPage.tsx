import { useEffect } from 'react';

import LoaderPage from '@proton/components/containers/app/LoaderPage';

/** LoaderPage that reports when it goes away, which is when the content it stood for is ready. */
export const TrackedLoaderPage = ({ onUnmount }: { onUnmount: () => void }) => {
    useEffect(() => onUnmount, [onUnmount]);

    return <LoaderPage />;
};
