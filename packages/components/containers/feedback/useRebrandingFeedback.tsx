import { useEffect, useState } from 'react';

import { DAY } from '@proton/shared/lib/constants';

import { FeatureCode } from '../features';
import { useFeature } from '../../hooks';
import useHasRebrandingFeedback from './useHasRebrandingFeedback';

export interface RebrandingFeatureValue {
    /* User has visited rebranding in the past */
    visited: boolean;
    /* User has given rebranding feedback */
    completed: boolean;
    /* User has been prompted for rebranding feedback in the past */
    prompted: boolean;
}

/*
 * Need to make sure that the functionality inside of the useEffect below really only runs once per runtime of
 * the application independently of what happens in the react tree. After the useEffect has ran once, we don't
 * ever want to run it again in the same runtime.
 */
let logicAlreadyRanDuringCurrentRuntime = false;

const useRebrandingFeedback = () => {
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const rebranding = useFeature<RebrandingFeatureValue>(FeatureCode.RebrandingFeedback);

    const [handleDisplay, setHandleDisplay] = useState<undefined | (() => void)>(undefined);

    useEffect(() => {
        if (
            rebranding.loading ||
            !rebranding.feature?.Value ||
            logicAlreadyRanDuringCurrentRuntime ||
            !hasRebrandingFeedback
        ) {
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

        const { visited, completed, prompted } = rebrandingValue;

        const prompt = () => {
            /**
             * User has already visited the v5 / rebranding update AND has already been
             * prompted for feedback previously. So we don't ask again.
             */
            if (prompted) {
                return;
            }

            /* We didn't prompt the user but they already gave feedback on their own */
            if (completed) {
                return;
            }

            /*
             * We want to store the "handleDisplay" callback here, not use react's
             * setState callback api, therefore the curry. Yum!
             */
            setHandleDisplay(() => () => {
                updateRebranding({ prompted: true });
            });
        };

        /**
         * User is visiting v5 / rebranding for the first time, we register this so
         * that we can prompt them the next time they visit again.
         *
         * Alternatively, we also schedule a timer should the user not refresh / close
         * his browser for a really long time, prompting him anyway after expiration of
         * a certain amount of time in that case.
         */
        if (!visited) {
            updateRebranding({ visited: true });

            promptTimeoutId = window.setTimeout(prompt, DAY);

            return;
        }

        prompt();

        return () => {
            window.clearTimeout(promptTimeoutId);
        };
    }, [rebranding.loading, rebranding, hasRebrandingFeedback]);

    return handleDisplay;
};

export default useRebrandingFeedback;
