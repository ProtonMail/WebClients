import { useEffect, useState } from 'react';

import { EasySwitchFeatureFlag } from '@proton/activation/src/interface';
import { ExperimentCode, FeatureCode, useExperiment, useFeature, useWelcomeFlags } from '@proton/components/index';

const useGmailSync = () => {
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const easySwitch = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const gmailSyncOnboarding = useExperiment(ExperimentCode.GmailSyncOnboarding);

    const [derivedValues, setDerivedValues] = useState({
        isBlurred: false,
        displayOnboarding: false,
        displaySync: false,
    });

    useEffect(() => {
        const hasSawWelcome = welcomeFlags.isDone;

        if (gmailSyncOnboarding.loading || easySwitch.loading || hasSawWelcome) {
            setDerivedValues({
                isBlurred: false,
                displayOnboarding: false,
                displaySync: false,
            });
        } else if (!gmailSyncOnboarding.loading && gmailSyncOnboarding.value === 'A') {
            setDerivedValues({
                isBlurred: true,
                displayOnboarding: true,
                displaySync: false,
            });
        } else if (
            !gmailSyncOnboarding.loading &&
            gmailSyncOnboarding.value === 'B' &&
            easySwitch.feature?.Value.GoogleMailSync === true
        ) {
            setDerivedValues({
                isBlurred: true,
                displayOnboarding: false,
                displaySync: true,
            });
        }
    }, [gmailSyncOnboarding.loading, easySwitch.loading, welcomeFlags]);

    const handleSyncSkip = () => {
        setDerivedValues({
            isBlurred: true,
            displayOnboarding: true,
            displaySync: false,
        });
    };

    const handleSyncCallback = (hasError: boolean) => {
        if (!hasError) {
            setWelcomeFlagsDone();
            setDerivedValues({
                isBlurred: false,
                displayOnboarding: false,
                displaySync: false,
            });
        }
    };

    return {
        derivedValues,
        handleSyncSkip,
        handleSyncCallback,
    };
};

export default useGmailSync;
