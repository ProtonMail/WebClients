import React, { useState, createContext, useEffect, useContext } from 'react';
import { c } from 'ttag';
import { ResourceType } from '../../interfaces/link';
import { useLoading, LoaderPage } from 'react-components';
import useDrive from '../../hooks/useDrive';

interface DriveResourceProviderState {
    resource?: DriveResource;
    setResource: (resource?: DriveResource) => void;
}

// TODO: remove type, should alway be folder
export type DriveResource = { shareId: string; type: ResourceType; linkId: string };

const DriveResourceContext = createContext<DriveResourceProviderState | null>(null);

interface Props {
    children: React.ReactNode;
}

/**
 * Manages drive initialization (starting onboarding).
 * Stores open folder shareId and linkID for easy access.
 */
const DriveResourceProvider = ({ children }: Props) => {
    const [loading, withLoading] = useLoading(true);
    const { initDrive } = useDrive();
    const [resource, setResource] = useState<DriveResource>();

    useEffect(() => {
        withLoading(initDrive()).catch((error) =>
            setResource(() => {
                throw error;
            })
        );
    }, []);

    if (loading) {
        return <LoaderPage text={c('Info').t`Loading ProtonDrive`} />;
    }

    return <DriveResourceContext.Provider value={{ resource, setResource }}>{children}</DriveResourceContext.Provider>;
};

export const useDriveResource = () => {
    const state = useContext(DriveResourceContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveResourceProvider');
    }
    return state;
};

export default DriveResourceProvider;
