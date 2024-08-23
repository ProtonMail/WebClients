import { useEffect } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { FeatureCode } from '@proton/components/containers/features';
import useApi from '@proton/components/hooks/useApi';
import useFeature from '@proton/components/hooks/useFeature';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { TelemetryMeasurementGroups, TelemetryProtonTipsEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

const TIP_HIDDEN = -1 as const;

const TipsAndInsightsToggle = () => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { update, feature, loading: featureLoading } = useFeature(FeatureCode.ProtonTipsSnoozeTime);
    const { state, toggle, set } = useToggle();
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (featureLoading || !feature) {
            return;
        }

        set(feature.Value !== -1);
    }, [feature, featureLoading]);

    const handleChange = async () => {
        toggle();
        await update(state ? TIP_HIDDEN : 0);
        createNotification({ text: c('Success').t`Preference saved` });

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailProtonTips,
            event: TelemetryProtonTipsEvents.tipChangeState,
            dimensions: {
                state: state ? 'disabled' : 'enabled',
            },
        });
    };

    return (
        <Toggle
            checked={state}
            loading={loading}
            onChange={() => {
                void withLoading(handleChange());
            }}
        />
    );
};

export default TipsAndInsightsToggle;
