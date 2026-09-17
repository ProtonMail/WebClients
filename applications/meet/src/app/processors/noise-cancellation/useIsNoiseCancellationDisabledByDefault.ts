import { isEdgeChromium, isWindows } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

/** Opts Edge for Windows out of noise cancellation, where it is known to misbehave because of Edge's default power saving mode. */
export const useIsNoiseCancellationDisabledByDefault = () => {
    const disableOnEdge = useFlag('MeetForceDisableNoiseCancellationOnEdge');

    return disableOnEdge && isEdgeChromium() && isWindows();
};
