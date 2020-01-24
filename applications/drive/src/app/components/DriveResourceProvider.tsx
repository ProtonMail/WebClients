import React, { useState, createContext, useEffect, useContext } from 'react';
import { ResourceType } from '../interfaces/folder';
import { useModals, useLoading, LoaderPage } from 'react-components';
import useDrive from '../hooks/useDrive';
import OnboardingModal from './OnboardingModal/OnboardingModal';

interface DriveResourceProviderState {
    resource?: DriveResource;
    setResource: (resource?: DriveResource) => void;
}

export type DriveResource = { shareId: string; type: ResourceType; linkId: string };

const DriveResourceContext = createContext<DriveResourceProviderState | null>(null);

interface Props {
    children: React.ReactNode;
}

const DriveResourceProvider = ({ children }: Props) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading(true);
    const { createVolume, loadDrive } = useDrive();
    const [resource, setResource] = useState<DriveResource>();

    useEffect(() => {
        let didCancel = false;

        const initDrive = async () => {
            const initResult = await loadDrive();

            if (!initResult) {
                const { Share } = await createVolume();
                createModal(<OnboardingModal />);
                if (!didCancel) {
                    setResource({ shareId: Share.ID, linkId: Share.LinkID, type: ResourceType.FOLDER });
                }
                return;
            }
        };

        withLoading(initDrive()).catch((error) =>
            setResource(() => {
                throw error;
            })
        );

        return () => {
            didCancel = true;
        };
    }, []);

    return (
        <>
            {loading ? (
                <LoaderPage />
            ) : (
                <DriveResourceContext.Provider value={{ resource, setResource }}>
                    {children}
                </DriveResourceContext.Provider>
            )}
        </>
    );
};

export const useDriveResource = () => {
    const state = useContext(DriveResourceContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveResourceProvider');
    }
    return state;
};

export default DriveResourceProvider;
