import { useEffect, useState } from 'react';

import { DAY } from '@proton/shared/lib/constants';

import { FeatureCode } from '../features';
import { useFeature } from '../../hooks';

export interface RebrandingFeatureValue {
    hasVisitedRebrandingInThePast: boolean;
    hasGivenRebrandingFeedback: boolean;
    hasBeenPromptedForRebrandingFeedback: boolean;
}

/*
 * Need to make sure that the functionality inside of the useEffect below really only runs once per runtime of
 * the application independently of what happens in the react tree. After the useEffect has ran once, we don't
 * ever want to run it again in the same runtime.
 */
let logicAlreadyRanDuringCurrentRuntime = false;

const useRebrandingFeedback = () => {
    const rebrandingFeedbackEnabled = useFeature(FeatureCode.RebrandingFeedbackEnabled);
    const rebranding = useFeature<RebrandingFeatureValue>(FeatureCode.RebrandingFeedback);

    const [handleDisplay, setHandleDisplay] = useState<undefined | (() => void)>(undefined);

    const loading = rebrandingFeedbackEnabled.loading || rebranding.loading;

    useEffect(() => {
        if (loading || !rebranding.feature?.Value || logicAlreadyRanDuringCurrentRuntime) {
            return;
        }

        /**
         * Features are assumed to be loaded at this point, as ensured by the conditions above.
         * This is important because this logic is only supposed to run once ever, therefore the
         * data it consumes needs to be guaranteed in advance.
         */
        logicAlreadyRanDuringCurrentRuntime = true;

        let promptTimeoutId: undefined | number;

        const { Value: rebrandingValue } = rebranding.feature;

        const updateRebranding = (value: Partial<RebrandingFeatureValue>) => {
            void rebranding.update({ ...rebrandingValue, ...value });
        };

        const { hasVisitedRebrandingInThePast, hasGivenRebrandingFeedback, hasBeenPromptedForRebrandingFeedback } =
            rebrandingValue;

        const prompt = () => {
            /**
             * User has already visited the v5 / rebranding update AND has already been
             * prompted for feedback previously. So we don't ask again.
             */
            if (hasBeenPromptedForRebrandingFeedback) {
                return;
            }

            /* We didn't prompt the user but they already gave feedback on their own */
            if (hasGivenRebrandingFeedback) {
                return;
            }

            /*
             * We want to store the "handleDisplay" callback here, not use react's
             * setState callback api, therefore the curry. Yum!
             */
            setHandleDisplay(() => () => {
                updateRebranding({ hasBeenPromptedForRebrandingFeedback: true });
            });
        };

        /* Rebranding feedback is globally disabled */
        if (!rebrandingFeedbackEnabled.feature?.Value) {
            return;
        }

        /**
         * User is visiting v5 / rebranding for the first time, we register this so
         * that we can prompt them the next time they visit again.
         *
         * Alternatively, we also schedule a timer should the user not refresh / close
         * his browser for a really long time, prompting him anyway after expiration of
         * a certain amount of time in that case.
         */
        if (!hasVisitedRebrandingInThePast) {
            updateRebranding({ hasVisitedRebrandingInThePast: true });

            promptTimeoutId = window.setTimeout(prompt, DAY);

            return;
        }

        prompt();

        return () => {
            window.clearTimeout(promptTimeoutId);
        };
    }, [loading, rebranding, rebrandingFeedbackEnabled]);

    return handleDisplay;
};

export default useRebrandingFeedback;
