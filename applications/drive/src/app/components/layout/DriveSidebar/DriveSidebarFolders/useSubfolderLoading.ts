import { useEffect, useState } from 'react';

import { Folder } from './useFolders';

export default function useSubfolderLoading(folder: Folder, initialState = false) {
    const [isLoading, setIsLoading] = useState(initialState);

    useEffect(() => {
        if (folder.loaded) {
            setIsLoading(false);
        }
        if (!folder.expanded || folder.loaded) {
            return;
        }
        const t = setTimeout(() => setIsLoading(true), 250);
        return () => {
            clearTimeout(t);
        };
    }, [folder]);

    return isLoading;
}
