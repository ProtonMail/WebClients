import { Quality } from '../types';

const increasedVideoQuality = process.env.LIVEKIT_INCREASED_VIDEO_QUALITY === 'true';
const decreasedVideoQuality = process.env.LIVEKIT_DECREASED_VIDEO_QUALITY === 'true';

export const useQualityLevel = () => {
    if (decreasedVideoQuality) {
        return Quality.Decreased;
    }

    return increasedVideoQuality ? Quality.Increased : Quality.Default;
};
