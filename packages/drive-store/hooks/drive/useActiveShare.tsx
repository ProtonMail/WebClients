import { createContext, useContext } from 'react';

type DriveFolder = { shareId: string; linkId: string };

interface ActiveShareProviderState {
    activeShareId: string;
    activeFolder: DriveFolder;
    setFolder: (folder: DriveFolder) => void;
    setDefaultRoot: () => void;
}

const DriveFolderContext = createContext<ActiveShareProviderState | null>(null);


export const useActiveShare = () => {
    const state = useContext(DriveFolderContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ActiveShareProvider');
    }
    return state;
};
