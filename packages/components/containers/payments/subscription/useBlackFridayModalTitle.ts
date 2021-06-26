import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { APPS, SECOND } from '@proton/shared/lib/constants';
import { isCyberMonday } from '@proton/shared/lib/helpers/blackfriday';
import { getAppName } from '@proton/shared/lib/apps/helper';

const EVERY_SECOND = SECOND;

const useBlackFridayModalTitle = (productPayer: boolean) => {
    const [now, setNow] = useState(new Date());
    const driveAppName = getAppName(APPS.PROTONDRIVE);

    useEffect(() => {
        const intervalID = setInterval(() => {
            setNow(new Date());
        }, EVERY_SECOND);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    if (productPayer) {
        return c('blackfriday Title').t`${driveAppName} early access offer`;
    }

    if (now && isCyberMonday()) {
        return c('blackfriday Title').t`Cyber Monday Sale`;
    }

    return c('blackfriday Title').t`Black Friday Sale`;
};

export default useBlackFridayModalTitle;
