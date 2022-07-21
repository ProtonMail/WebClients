import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';

import { MINUTE } from '@proton/shared/lib/constants';

import favicons from '../../assets/favicons';

const Favicon = () => {
    const [date, setDate] = useState(() => new Date().getDate());

    useEffect(() => {
        const defaultIcon = document.querySelector(
            'link[rel="icon"][type="image/svg+xml"]:not([data-dynamic-favicon])'
        );
        // Ensure the old svg favicon is removed, otherwise chrome has trouble updating to the dynamic icon.
        defaultIcon?.remove();

        const interval = setInterval(() => {
            const dateNow = new Date().getDate();

            if (dateNow !== date) {
                setDate(dateNow);
            }
        }, MINUTE);

        return () => {
            clearInterval(interval);
        };
    }, [date]);

    return (
        <Helmet>
            <link rel="icon" href={favicons[date]} type="image/svg+xml" data-dynamic-favicon="true" />
        </Helmet>
    );
};

export default Favicon;
