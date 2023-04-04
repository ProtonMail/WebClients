import { useEffect, useState } from 'react';

import { EasySwitchFeatureFlag } from '@proton/activation/src/interface';
import {
    ExperimentCode,
    FeatureCode,
    useApi,
    useExperiment,
    useFeature,
    useUserSettings,
    useWelcomeFlags,
} from '@proton/components/index';
import { updateFlags, updateWelcomeFlags } from '@proton/shared/lib/api/settings';
import noop from '@proton/utils/noop';

const useGmailSync = () => {
    const api = useApi();
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const [userSettings, userSettingsLoading] = useUserSettings();
    const experimentCondition = userSettings && userSettings.Locale.startsWith('en');
    const easySwitch = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const gmailSyncOnboarding = useExperiment(ExperimentCode.GmailSyncOnboarding, experimentCondition);

    const [derivedValues, setDerivedValues] = useState({
        displayOnboarding: false,
        displaySync: false,
    });

    useEffect(() => {
        const hasSawWelcome = welcomeFlags.isDone;

        if (hasSawWelcome) {
            setDerivedValues({ displayOnboarding: false, displaySync: false });
        } else if (experimentCondition && (gmailSyncOnboarding.loading || easySwitch.loading)) {
            setDerivedValues({
                displayOnboarding: false,
                displaySync: false,
            });
        } else if (
            (!gmailSyncOnboarding.loading && gmailSyncOnboarding.value === 'A') ||
            (!experimentCondition && gmailSyncOnboarding.loading && !userSettingsLoading) //We have to display default onboarding to all users that aren't in the experiment
        ) {
            setDerivedValues({
                displayOnboarding: true,
                displaySync: false,
            });
        } else if (
            !gmailSyncOnboarding.loading &&
            gmailSyncOnboarding.value === 'B' &&
            easySwitch.feature?.Value.GoogleMailSync === true
        ) {
            setDerivedValues({
                displayOnboarding: false,
                displaySync: true,
            });
        }
    }, [gmailSyncOnboarding.loading, easySwitch.loading, welcomeFlags, userSettingsLoading]);

    const handleSyncSkip = () => {
        setDerivedValues({
            displayOnboarding: true,
            displaySync: false,
        });
    };

    const handleSyncCallback = async (hasError: boolean) => {
        if (!hasError) {
            setWelcomeFlagsDone();

            if (welcomeFlags.isWelcomeFlow) {
                // Set generic welcome to true
                await api(updateFlags({ Welcomed: 1 })).catch(noop);
            }
            if (!userSettings.WelcomeFlag) {
                // Set product specific welcome to true
                await api(updateWelcomeFlags()).catch(noop);
            }

            setDerivedValues({
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
