import { useCallback, useState } from 'react';

export const usePhotosSelection = () => {
    const [selection, setSelection] = useState<Record<string, boolean>>({});

    const setSelected = useCallback(
        (isSelected: boolean, ...linkIds: string[]) => {
            setSelection((state) => {
                let newState = { ...state };

                linkIds.forEach((linkId) => {
                    if (isSelected) {
                        newState[linkId] = true;
                    } else {
                        delete newState[linkId];
                    }
                });

                return newState;
            });
        },
        [setSelection]
    );

    const clearSelection = useCallback(() => {
        setSelection({});
    }, [setSelection]);

    return {
        selection,
        setSelected,
        clearSelection,
    };
};

export default usePhotosSelection;
