import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { SECOND } from '@proton/shared/lib/constants';
import { isCyberMonday } from '@proton/shared/lib/helpers/blackfriday';

const EVERY_SECOND = SECOND;

const useBlackFridayModalTitle = (productPayer: boolean) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const intervalID = setInterval(() => {
            setNow(new Date());
        }, EVERY_SECOND);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    if (productPayer) {
        return c('blackfriday Title').t`Save more when combining Mail and VPN`;
    }

    if (now && isCyberMonday()) {
        return c('blackfriday Title').t`Cyber Monday Sale`;
    }

    return c('blackfriday Title').t`Black Friday Sale`;
};

export default useBlackFridayModalTitle;
