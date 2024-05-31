import { useInterval } from '@proton/components';
import { serverTime } from '@proton/crypto';

import { isExpired } from 'proton-mail/helpers/expiration';

import { EXPIRATION_CHECK_FREQUENCY } from '../constants';
import { Element } from '../models/element';

export const useExpirationCheck = (elements: Element[], expiredCallback: (elements: Element[]) => void) => {
    useInterval(EXPIRATION_CHECK_FREQUENCY, () => {
        const nowTimestamp = +serverTime();
        expiredCallback(
            elements.filter((element) => {
                return isExpired(element, nowTimestamp);
            })
        );
    });
};
