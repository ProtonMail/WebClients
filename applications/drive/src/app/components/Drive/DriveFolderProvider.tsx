import { useState, createContext, useContext } from 'react';
import * as React from 'react';

export type DriveFolder = { shareId: string; linkId: string };

interface DriveFolderProviderState {
    folder?: DriveFolder;
    setFolder: (folder?: DriveFolder) => void;
}

const DriveFolderContext = createContext<DriveFolderProviderState | null>(null);

interface Props {
    children: React.ReactNode;
}

/**
 * Manages drive initialization (starting onboarding).
 * Stores open folder shareId and linkID for easy access.
 */
const DriveFolderProvider = ({ children }: Props) => {
    const [folder, setFolder] = useState<DriveFolder>();
    return <DriveFolderContext.Provider value={{ folder, setFolder }}>{children}</DriveFolderContext.Provider>;
};

export const useDriveActiveFolder = () => {
    const state = useContext(DriveFolderContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveFolderProvider');
    }
    return state;
};

export default DriveFolderProvider;
