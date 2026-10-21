import NotificationsChildren from '@proton/components/containers/notifications/Children';

import { useLumoFlags } from '../hooks/useLumoFlags';
import { canShowWebComposer } from '../util/userAgent';

const ConditionalNotificationsChildren = () => {
    const { nativeComposer } = useLumoFlags();
    if (!canShowWebComposer(nativeComposer)) {
        return null;
    }
    return <NotificationsChildren />;
};

export default ConditionalNotificationsChildren;
