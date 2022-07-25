import { FeatureCode } from '@proton/components/containers';
import { useFeature } from '@proton/components/hooks';

export default function useDevicesFeatureFlag() {
    const flagValue = useFeature(FeatureCode.DriveMyDevices)?.feature?.Value;
    return flagValue;
}
