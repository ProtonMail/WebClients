import { FeatureCode } from '@proton/components/containers';
import { useFeature } from '@proton/components/hooks';

export default () => useFeature(FeatureCode.DriveMyDevices)?.feature?.Value;
