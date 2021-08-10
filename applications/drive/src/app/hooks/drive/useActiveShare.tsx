import { useCallback, useState, createContext, useContext } from 'react';
import * as React from 'react';

export type DriveFolder = { shareId: string; linkId: string };

interface ActiveShareProviderState {
    activeShareId: string;
    activeFolder: DriveFolder;
    setFolder: (folder: DriveFolder) => void;
    setDefaultRoot: () => void;
}

const DriveFolderContext = createContext<ActiveShareProviderState | null>(null);

interface Props {
    defaultShareRoot: DriveFolder;
    children: React.ReactNode;
}

/**
 * Manages active share ID and folder.
 * Share is entrypoint to file tree. Every user has at least one default share
 * which is passed to provider by `defaultShare`.
 * Default share points to folder link. That is considered root and is default
 * `activeFolder`. Active folder can be changed by `setFolder`, typically from
 * container based on URL parameters.
 * When navigating back to root, `setDefaultRoot` should be called to reset
 * the active share ID and folder back to default root share.
 */
export const ActiveShareProvider = ({ defaultShareRoot, children }: Props) => {
    const [activeFolder, setActiveFolder] = useState<DriveFolder>(defaultShareRoot);

    const setFolder = useCallback((newActiveFolder: DriveFolder) => {
        setActiveFolder(newActiveFolder);
    }, []);

    const setDefaultRoot = useCallback(() => {
        setActiveFolder(defaultShareRoot);
    }, [defaultShareRoot]);

    return (
        <DriveFolderContext.Provider
            value={{
                activeShareId: activeFolder.shareId,
                activeFolder,
                setFolder,
                setDefaultRoot,
            }}
        >
            {children}
        </DriveFolderContext.Provider>
    );
};

export const useActiveShare = () => {
    const state = useContext(DriveFolderContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ActiveShareProvider');
    }
    return state;
};

export default useActiveShare;
