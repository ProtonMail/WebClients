import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import useAuthentication from '../../hooks/useAuthentication';
import useLocalState from '../../hooks/useLocalState';
import TopBanner from './TopBanner';

const NGC_URL = 'https://new-calendar.proton.me';

const NGCAccessTopBanner = () => {
    const hasNGCAccess = useFlag('NGCWebAccess');
    const [user] = useUser();
    const authentication = useAuthentication();
    const [isDismissed, setIsDismissed] = useLocalState(false, `${user.ID}-ngc-access-banner`);

    if (!hasNGCAccess || isDismissed) {
        return null;
    }

    // Carry over the local ID so the new app opens on the same session when several accounts are signed in
    const href = [NGC_URL, getLocalIDPath(authentication.getLocalID())].filter(isTruthy).join('/');

    const link = (
        <Href key="ngc-link" href={href}>
            {c('ngc_access_banner: action').t`Try it now`}
        </Href>
    );

    return (
        <TopBanner className="bg-info" data-testid="ngc-access-banner" onClose={() => setIsDismissed(true)}>
            {
                // translator: full sentence "You now have access to the new Proton Calendar. Try it now"
                c('ngc_access_banner: info').jt`You now have access to the new ${CALENDAR_APP_NAME}. ${link}`
            }
        </TopBanner>
    );
};

export default NGCAccessTopBanner;
