import React, { useState, useEffect } from 'react';

import RightToLeftContext from './context';

const getIsRTL = (lang: string) => {
    return /^fa/.test(lang);
};

interface Props {
    children: React.ReactNode;
}

const Provider = ({ children }: Props) => {
    const state = useState(getIsRTL(document.documentElement.lang));
    const [isRTL, setRTL] = state;

    useEffect(() => {
        const observer = new MutationObserver((e) => {
            if (e.some(({ attributeName }) => attributeName === 'lang')) {
                setRTL(getIsRTL(document.documentElement.lang));
            }
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    }, [isRTL]);

    return <RightToLeftContext.Provider value={state}>{children}</RightToLeftContext.Provider>;
};

export default Provider;
