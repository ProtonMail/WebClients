import useKeyPress from '@proton/components/hooks/useKeyPress';

export const useSearchShortcut = (onTriggered: () => void) => {
    useKeyPress(
        (evt) => {
            if ((evt.ctrlKey || evt.metaKey) && evt.key === 'f') {
                evt.preventDefault();
                onTriggered();
            }
        },
        [onTriggered]
    );
};
