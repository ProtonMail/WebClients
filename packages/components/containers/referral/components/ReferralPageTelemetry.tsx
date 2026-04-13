import { useEffect } from 'react';

import { useReferralTelemetry } from '../hooks/useReferralTelemetry';

const ReferralPageTelemetry = () => {
    const { sendReferralPageView } = useReferralTelemetry();

    useEffect(() => {
        sendReferralPageView();
    }, [sendReferralPageView]);

    return null;
};

export default ReferralPageTelemetry;
