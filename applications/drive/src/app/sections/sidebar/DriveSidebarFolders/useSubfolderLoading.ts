import { useEffect, useState } from 'react';

import type { TreeItem } from '../../../store';

export const useSubfolderLoading = (folder: TreeItem) => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (folder.isLoaded) {
            setIsLoading(false);
        }
        if (!folder.isExpanded || folder.isLoaded) {
            return;
        }
        const t = setTimeout(() => setIsLoading(true), 250);
        return () => {
            clearTimeout(t);
        };
    }, [folder]);

    return isLoading;
};
