import type { ReactNode } from 'react';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import useIsSafetyReviewAvailable from '../../hooks/accounts/useIsSafetyReviewAvailable';
import useConfig from '../../hooks/useConfig';

export const SecurityCheckup = ({
    children,
}: {
    children: (options: { to: string; toApp: APP_NAMES; target: string }) => ReactNode;
}) => {
    const { APP_NAME } = useConfig();
    const isSafetyReviewAvailable = useIsSafetyReviewAvailable();
    const { isMnemonicSet, isMnemonicAvailable } = useSelector(selectMnemonicData);

    const securityCheckupParams = (() => {
        return new URLSearchParams({
            back: encodeURIComponent(window.location.href),
            source: 'user_dropdown',
            appname: APP_NAME,
        });
    })();

    if (!isSafetyReviewAvailable) {
        return null;
    }

    if (isMnemonicAvailable && !isMnemonicSet) {
        /**
         * Only show safety review prompt if phrase needs to be set
         */
        return children({
            toApp: APPS.PROTONACCOUNT,
            to: `${SECURITY_CHECKUP_PATHS.ROOT}?${securityCheckupParams.toString()}`,
            target: '_self',
        });
    }

    return null;
};
