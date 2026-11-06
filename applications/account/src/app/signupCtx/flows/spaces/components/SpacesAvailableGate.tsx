import type { ReactNode } from 'react';
import { Redirect } from 'react-router-dom';

import { useFlagsStatus } from '@unleash/proxy-client-react';

import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { useFlag } from '@proton/unleash/useFlag';

interface Props {
    fallbackPath: string;
    children: ReactNode;
}

const SpacesAvailableGate = ({ fallbackPath, children }: Props) => {
    const { flagsReady } = useFlagsStatus();
    const isSpacesAvailable = useFlag('SpacesAvailable');

    if (!flagsReady) {
        return <LoaderPage />;
    }

    if (!isSpacesAvailable) {
        return <Redirect to={fallbackPath} />;
    }

    return <>{children}</>;
};

export default SpacesAvailableGate;
