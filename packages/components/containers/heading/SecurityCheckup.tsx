import type { ReactNode } from 'react';

import useIsSecurityCheckupAvailable from '@proton/components/hooks/securityCheckup/useIsSecurityCheckupAvailable';
import useSecurityCheckup from '@proton/components/hooks/securityCheckup/useSecurityCheckup';
import useConfig from '@proton/components/hooks/useConfig';
import useIsSentinelUser from '@proton/components/hooks/useIsSentinelUser';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

export const SecurityCheckup = ({
    children,
}: {
    children: (options: { to: string; toApp: APP_NAMES; target: string }) => ReactNode;
}) => {
    const { APP_NAME } = useConfig();
    const [{ isSentinelUser }] = useIsSentinelUser();
    const isSecurityCheckupAvailable = useIsSecurityCheckupAvailable();
    const securityCheckup = useSecurityCheckup();

    const securityCheckupParams = (() => {
        return new URLSearchParams({
            back: encodeURIComponent(window.location.href),
            source: 'user_dropdown',
            appname: APP_NAME,
        });
    })();

    return !isSentinelUser &&
        isSecurityCheckupAvailable &&
        (securityCheckup.actions.includes('phrase') || securityCheckup.furtherActions.includes('phrase'))
        ? children({
              toApp: APPS.PROTONACCOUNT,
              to: `${SECURITY_CHECKUP_PATHS.ROOT}?${securityCheckupParams.toString()}`,
              target: '_self',
          })
        : null;
};
