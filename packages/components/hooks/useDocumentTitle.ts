import { useMemo } from 'react';

const useDocumentTitle = (title?: string) => {
    // This is explicitly happening in render and not in a useEffect to allow children to override parent titles
    useMemo(() => {
        if (title === undefined) {
            return;
        }
        document.title = title;
    }, [title]);
};

export default useDocumentTitle;
