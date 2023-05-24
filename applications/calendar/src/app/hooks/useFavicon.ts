import { useEffect } from 'react';

import useDynamicMonthDay from '@proton/components/hooks/useDynamicMonthDay';

import favicons from '../../assets/favicons';

const useFavicon = () => {
    const onChangeMonthDay = () => {
        // Ensure all favicons are removed, otherwise chrome has trouble updating to the dynamic icon
        const links = document.querySelectorAll('link[rel="icon"]:not([data-dynamic-favicon]');
        links.forEach((link) => {
            link.remove();
        });
    };
    const monthDay = useDynamicMonthDay({ onChangeMonthDay });

    useEffect(() => {
        const favicon = document.querySelector('link[rel="icon"][type="image/svg+xml"][data-dynamic-favicon]');
        // Add random param to force refresh
        const randomParameter = Math.random().toString(36).substring(2);
        const href = `${favicons[monthDay]}?v=${randomParameter}`;

        if (favicon) {
            favicon.setAttribute('href', href);
        } else {
            const link = document.createElement('link');
            link.setAttribute('rel', 'icon');
            link.setAttribute('type', 'image/svg+xml');
            link.setAttribute('data-dynamic-favicon', '');
            link.setAttribute('href', href);
            document.head.appendChild(link);
        }
    }, [monthDay]);
};

export default useFavicon;
