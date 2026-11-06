import type { ReactNode } from 'react';

import { useFlagsStatus } from '@unleash/proxy-client-react';

import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { useFlag } from '@proton/unleash/useFlag';

interface Props {
    /** What to show when Spaces isn't available. */
    fallback: ReactNode;
    children: ReactNode;
}

const SpacesAvailableGate = ({ fallback, children }: Props) => {
    const { flagsReady } = useFlagsStatus();
    const isSpacesAvailable = useFlag('SpacesAvailable');

    if (!flagsReady) {
        return <LoaderPage />;
    }

    if (!isSpacesAvailable) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default SpacesAvailableGate;
