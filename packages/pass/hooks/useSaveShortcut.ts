import useKeyPress from '@proton/components/hooks/useKeyPress';

export const useSaveShortcut = (onSave: () => void) => {
    useKeyPress(
        (evt) => {
            if ((evt.ctrlKey || evt.metaKey) && evt.key === 's') {
                evt.preventDefault();
                onSave();
            }
        },
        [onSave]
    );
};
