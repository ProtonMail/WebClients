import { FeatureCode, useFeature } from '@proton/components';

export const usePhotosFeatureFlag = () => useFeature(FeatureCode.DrivePhotos)?.feature?.Value;
