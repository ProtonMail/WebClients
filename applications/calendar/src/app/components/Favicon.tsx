import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

import { MINUTE } from '@proton/shared/lib/constants';

import favicons from '../../assets/favicons';

const Favicon = () => {
    const [date, setDate] = useState(() => new Date().getDate());

    useEffect(() => {
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
            <link rel="icon" href={favicons[date]} type="image/svg+xml" />
        </Helmet>
    );
};

export default Favicon;
