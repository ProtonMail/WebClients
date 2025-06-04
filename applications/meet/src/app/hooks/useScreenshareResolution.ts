import { screenShareQualityDetails } from '../qualityConstants';
import { useQualityLevel } from './useQualityLevel';

export const useScreenshareResolution = () => {
    const qualityLevel = useQualityLevel();

    return screenShareQualityDetails[qualityLevel];
};
