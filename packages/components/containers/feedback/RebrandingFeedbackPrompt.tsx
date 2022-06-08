import { useEffect, useState } from 'react';

import { DAY } from '@proton/shared/lib/constants';

import { FeatureCode } from '../features';
import { useFeature } from '../../hooks';
import RebrandingFeedbackModal from './RebrandingFeedbackModal';

/*
 * Need to make sure that the functionality inside of the useEffect below really only runs once per runtime of
 * the application independently of what happens in the react tree. After the useEffect has ran once, we don't
 * ever want to run it again in the same runtime.
 */
let logicAlreadyRanDuringCurrentRuntime = false;

const RebrandingFeedbackPrompt = () => {
    const rebrandingFeedback = useFeature(FeatureCode.RebrandingFeedback);
    const hasVisitedRebrandingInThePast = useFeature(FeatureCode.HasVisitedRebrandingInThePast);
    const hasBeenPromptedForRebrandingFeedback = useFeature(FeatureCode.HasBeenPromptedForRebrandingFeedback);
    const hasGivenRebrandingFeedback = useFeature(FeatureCode.HasGivenRebrandingFeedback);

    const [open, setOpen] = useState(false);

    const loading =
        rebrandingFeedback.loading ||
        hasVisitedRebrandingInThePast.loading ||
        hasGivenRebrandingFeedback.loading ||
        hasBeenPromptedForRebrandingFeedback.loading;

    useEffect(() => {
        if (loading) {
            return;
        }

        if (logicAlreadyRanDuringCurrentRuntime) {
            return;
        }

        /**
         * Features are assumed to be loaded at this point, as ensured by the conditions above.
         * This is important because this logic is only supposed to run once ever, therefore the
         * data it consumes needs to be guaranteed in advance.
         */
        logicAlreadyRanDuringCurrentRuntime = true;

        let promptTimeoutId: undefined | number;

        const prompt = () => {
            /**
             * User has already visited the v5 / rebranding update AND has already been
             * prompted for feedback previously. So we don't ask again.
             */
            if (hasBeenPromptedForRebrandingFeedback.feature?.Value) {
                return;
            }

            /* We didn't prompt the user but they already gave feedback on their own */
            if (hasGivenRebrandingFeedback.feature?.Value) {
                return;
            }

            setOpen(true);

            void hasBeenPromptedForRebrandingFeedback.update(true);
        };

        /* Rebranding feedback is globally disabled */
        if (!rebrandingFeedback.feature?.Value) {
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
        if (!hasVisitedRebrandingInThePast.feature?.Value) {
            void hasVisitedRebrandingInThePast.update(true);

            promptTimeoutId = window.setTimeout(prompt, DAY);

            return;
        }

        prompt();

        return () => {
            window.clearTimeout(promptTimeoutId);
        };
    }, [loading]);

    return <RebrandingFeedbackModal open={open} onClose={() => setOpen(false)} />;
};

export default RebrandingFeedbackPrompt;
