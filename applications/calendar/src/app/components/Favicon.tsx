import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

import { MINUTE } from '@proton/shared/lib/constants';

import favicons from '../../assets/favicons';

const Favicon = () => {
    const [date, setDate] = useState(new Date().getDate());

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
            <link rel="icon" type="image/svg+xml" href={favicons[date][0]} />
            <link rel="alternate icon" href={favicons[date][1]} />
        </Helmet>
    );
};

export default Favicon;
