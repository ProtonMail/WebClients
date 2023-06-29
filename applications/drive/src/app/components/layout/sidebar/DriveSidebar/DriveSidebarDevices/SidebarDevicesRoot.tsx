import { FeatureCode, useFeature } from '@proton/components';
import { IsActiveInEnvironmentContainer, Loader, NewFeatureTag } from '@proton/components/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useDevicesListing } from '../../../../../store/_devices';
import { getDevicesSectionName } from '../../../../sections/Devices/constants';
import ExpandButton from '../DriveSidebarFolders/ExpandButton';
import DriveSidebarListItem from '../DriveSidebarListItem';
import { useDriveMyDevicesSpotlight } from './useDriveMyDevicesSpotlight';

export function SidebarDevicesRoot({
    path,
    isExpanded,
    toggleExpand,
}: {
    path: string;
    toggleExpand: () => void;
    isExpanded: boolean;
}) {
    const { cachedDevices, isLoading } = useDevicesListing();
    const sectionTitle = getDevicesSectionName();

    const [driveMyDevicesProps, setShowDriveMyDevices] = useDriveMyDevicesSpotlight();
    const isActiveInEnvironment: IsActiveInEnvironmentContainer = { alpha: true, default: true };

    const featureDriveWindowsGA = !!useFeature(FeatureCode.DriveWindowsGA).feature?.Value;

    return (
        <DriveSidebarListItem
            key="devices-root"
            to={'/devices'}
            icon="tv"
            isActive={path === '/devices'}
            onDoubleClick={toggleExpand}
            onClick={() => setShowDriveMyDevices(false)}
        >
            <span className="text-ellipsis" title={sectionTitle}>
                {sectionTitle}
            </span>
            {isLoading ? (
                <Loader className="drive-sidebar--icon inline-flex flex-item-noshrink" />
            ) : (
                cachedDevices.length > 0 && (
                    <ExpandButton className="flex-item-noshrink" expanded={isExpanded} onClick={() => toggleExpand()} />
                )
            )}
            {featureDriveWindowsGA && (
                <NewFeatureTag
                    featureKey={FeatureCode.DriveWindowsGA}
                    endDate={new Date('2023-08-31')}
                    className="ml-2 md:ml-12 flex-item-noshrink"
                    spotlightProps={isMobile() ? undefined : driveMyDevicesProps}
                    isActiveInEnvironment={isActiveInEnvironment}
                    showOnce
                />
            )}
        </DriveSidebarListItem>
    );
}
