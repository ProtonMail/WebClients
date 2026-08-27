import { useCallback, useEffect, useRef, useState } from 'react';

export interface MultiCheckGroupsResult {
    addPromiseToGroup: (groupId: string, promise: Promise<unknown>) => void;
    isGroupLoading: (groupId: string) => boolean;
    isGroupChecked: (groupId: string) => boolean;
    getLoadingGroups: () => string[];
    clearGroup: (groupId: string) => void;
}

export const useMultiCheckGroups = (): MultiCheckGroupsResult => {
    const [loadingGroups, setLoadingGroups] = useState<Record<string, boolean>>({});
    const groupPromisesRef = useRef<Record<string, Set<Promise<unknown>>>>({});

    /**
     * Adds a promise to a group for tracking.
     *
     * NOTE: For already fulfilled promises, we don't need special handling due to how the JavaScript
     * event loop and React's batching work together:
     *
     * When an already fulfilled promise is added:
     * 1. The promise is added to the group
     * 2. Loading state is set to true
     * 3. The promise handler (which sets loading to false) is scheduled as a microtask
     * 4. Since React batches state updates, the loading=false update "wins" over the loading=true update
     * 5. Effectively, it appears as if already settled promises don't cause loading state changes
     *
     * This approach is simpler and works reliably, but it depends on React's batching behavior.
     */
    const addPromiseToGroup = useCallback(async (groupId: string, promise: Promise<unknown>) => {
        // Initialize the group if needed
        if (!groupPromisesRef.current[groupId]) {
            groupPromisesRef.current[groupId] = new Set();
        }

        // Add the promise to tracking
        groupPromisesRef.current[groupId].add(promise);

        // Update loading state
        setLoadingGroups((prev) => ({
            ...prev,
            [groupId]: true,
        }));

        // Create handler for when the promise eventually settles
        const handlePromiseCompletion = () => {
            if (groupPromisesRef.current[groupId]) {
                // Remove this promise from the group
                groupPromisesRef.current[groupId].delete(promise);

                // If this was the last promise in the group, update loading state
                if (groupPromisesRef.current[groupId].size === 0) {
                    setLoadingGroups((prevGroups) => ({
                        ...prevGroups,
                        [groupId]: false,
                    }));
                }
            }
        };

        // Handle promise completion and rejection
        promise.then(handlePromiseCompletion, handlePromiseCompletion);

        return promise;
    }, []);

    const isGroupLoading = useCallback(
        (groupId: string) => {
            return !!loadingGroups[groupId];
        },
        [loadingGroups]
    );

    const getLoadingGroups = useCallback(() => {
        return Object.entries(loadingGroups)
            .filter(([, isLoading]) => isLoading)
            .map(([groupId]) => groupId);
    }, [loadingGroups]);

    const clearGroup = useCallback((groupId: string) => {
        if (groupPromisesRef.current[groupId]) {
            groupPromisesRef.current[groupId].clear();
            delete groupPromisesRef.current[groupId];

            setLoadingGroups((prev) => ({
                ...prev,
                [groupId]: false,
            }));
        }
    }, []);

    const isGroupChecked = useCallback(
        (groupId: string) => {
            return !!loadingGroups[groupId] && groupPromisesRef.current[groupId]?.size === 0;
        },
        [loadingGroups, groupPromisesRef]
    );

    useEffect(() => {
        return () => {
            groupPromisesRef.current = {};
        };
    }, []);

    return {
        addPromiseToGroup,
        isGroupLoading,
        getLoadingGroups,
        clearGroup,
        isGroupChecked,
    };
};
