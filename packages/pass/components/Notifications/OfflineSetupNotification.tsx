import { type FC, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { HOUR, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useOfflineSetup } from '../../hooks/auth/useOfflineSetup';
import { useEpoch } from '../../hooks/useEpoch';
import { nextOfflinePrompt, shouldPromptOfflineSetup } from '../../lib/settings/offline-prompt';
import { settingsEditIntent } from '../../store/actions';
import { selectOfflineEnabled, selectOfflinePrompt } from '../../store/selectors';
import { PassFeature } from '../../types/api/features';
import { getEpoch } from '../../utils/time/epoch';
import { useOnline } from '../Core/ConnectivityProvider';
import { WithFeatureFlag } from '../Core/WithFeatureFlag';
import { NotificationBanner } from './InAppNotificationBanner';

type Props = { dense?: boolean };

const OfflineSetupBanner: FC<Props> = ({ dense }) => {
    const dispatch = useDispatch();
    const online = useOnline();
    const offlineEnabled = useSelector(selectOfflineEnabled);
    const prompt = useSelector(selectOfflinePrompt);
    const [setup, loading] = useOfflineSetup();

    const now = useEpoch(HOUR);
    const eligible = useMemo(() => shouldPromptOfflineSetup(prompt, now), [prompt, now]);

    /** Setting up offline mode requires an online SRP password check,
     * as such the prompt is pointless while connectivity is degraded */
    if (offlineEnabled || !online || !eligible) return null;

    const onDismiss = () =>
        dispatch(settingsEditIntent('offline', { offlinePrompt: nextOfflinePrompt(prompt, getEpoch()) }, true));

    const onEnable = () => setup().catch(noop);

    return (
        <NotificationBanner
            cta={{ disabled: loading, text: c('Action').t`Enable`, onClick: onEnable }}
            dense={dense}
            title={c('Title').t`Enable offline mode`}
            message={c('Info').t`View your ${PASS_SHORT_APP_NAME} items offline. Requires your password to enable.`}
            onDismiss={onDismiss}
        />
    );
};

/** Offline mode is flag-gated on the extension only: `offlineEnabled` hydration
 * has no feature flag on web & desktop (see `hydrate.saga`). */
export const OfflineSetupNotification: FC<Props> = EXTENSION_BUILD
    ? WithFeatureFlag(OfflineSetupBanner, PassFeature.PassExtensionOfflineV1)
    : OfflineSetupBanner;
