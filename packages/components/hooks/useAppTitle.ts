import { useEffect } from 'react';

const useAppTitle = (title: string, appName: string) => {
    useEffect(() => {
        document.title = [title, appName].filter(Boolean).join(' - ');
    }, [title]);
};

export default useAppTitle;
