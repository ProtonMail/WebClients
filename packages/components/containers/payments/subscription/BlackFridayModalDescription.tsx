import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { isBefore } from 'date-fns';
import { BLACK_FRIDAY, SECOND } from '@proton/shared/lib/constants';
import { isCyberMonday } from '@proton/shared/lib/helpers/blackfriday';

import { Countdown } from '../../../components';

const EVERY_SECOND = SECOND;

interface Props {
    isProductPayer: boolean;
}

const BlackFridayModalDescription = ({ isProductPayer }: Props) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const intervalID = setInterval(() => {
            setNow(new Date());
        }, EVERY_SECOND);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    if (isProductPayer) {
        return (
            <p className="text-center m0">{c('blackfriday Info')
                .t`Get early access to our new encrypted drive for FREE by upgrading to a Plus bundle now.`}</p>
        );
    }
    return (
        <div className="text-bold text-center mt0 blackfriday-countdown-container pb1 mb2">
            <Countdown
                end={
                    isBefore(now, BLACK_FRIDAY.CYBER_START)
                        ? BLACK_FRIDAY.CYBER_START
                        : isCyberMonday()
                        ? BLACK_FRIDAY.CYBER_END
                        : BLACK_FRIDAY.END
                }
            />
        </div>
    );
};

export default BlackFridayModalDescription;
