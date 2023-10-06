import { useCallback, useState } from 'react';

export const usePhotosSelection = () => {
    const [selection, setSelection] = useState<boolean[]>([]);

    const setSelected = useCallback(
        (indices: number[], isSelected: boolean) => {
            setSelection((state) => {
                indices.forEach((index) => {
                    state[index] = isSelected;
                });

                return [...state];
            });
        },
        [setSelection]
    );

    const clearSelection = useCallback(() => {
        setSelection([]);
    }, [setSelection]);

    return {
        selection,
        setSelected,
        clearSelection,
    };
};

export default usePhotosSelection;
