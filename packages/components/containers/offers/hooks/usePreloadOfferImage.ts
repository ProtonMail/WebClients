import { useEffect } from 'react';

const usePreloadOfferImage = (src: string | undefined) => {
    useEffect(() => {
        if (!src) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.append(link);

        return () => {
            link.remove();
        };
    }, [src]);
};

export default usePreloadOfferImage;
