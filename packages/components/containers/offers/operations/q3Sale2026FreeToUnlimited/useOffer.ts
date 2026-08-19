import { CommonFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import type { Operation } from '../../interface';
import { useQ3Sale2026Offer } from '../useQ3Sale2026Offer';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    // Turning this flag on replays the popup once for users who saw it but didn't opt out
    const replayAutoPopUp = useFlag(CommonFeatureFlag.Q3Sale2026FreeToUnlimitedSecondPopup);

    return useQ3Sale2026Offer({ configuration, getIsEligible, replayAutoPopUp });
};
