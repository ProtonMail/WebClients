import useKeyPress from '@proton/components/hooks/useKeyPress';

export const useNewItemShortcut = (onTriggered: () => void) => {
    useKeyPress(
        (evt) => {
            if ((evt.ctrlKey || evt.metaKey) && evt.key === 'n') {
                evt.preventDefault();
                onTriggered();
            }
        },
        [onTriggered]
    );
};
