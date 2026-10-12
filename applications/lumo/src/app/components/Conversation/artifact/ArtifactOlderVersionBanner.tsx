import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { ArtifactVersion } from './artifactRegistry';
import { formatArtifactVersionTime } from './artifactVersionLabels';

interface Props {
    version: ArtifactVersion;
    versionNumber: number;
    versionCount: number;
    onViewLatest: () => void;
}

/**
 * Shown above an older version: everything that changes the artifact (Lumo, inline edits, manual
 * edits) works on the latest version, so the user must not mistake this one for the live copy.
 */
export const ArtifactOlderVersionBanner = ({ version, versionNumber, versionCount, onViewLatest }: Props) => {
    const time = formatArtifactVersionTime(version.createdAt);
    return (
        <div className="shrink-0 flex flex-row flex-nowrap items-center gap-3 px-4 py-2 bg-weak border-bottom border-weak text-sm">
            <LumoIcon name="RotateCcwClock" size={16} className="shrink-0 color-weak" />
            <span className="flex-1 min-w-0 color-norm">
                {c('collider_2025:Info').t`You're viewing version ${versionNumber} of ${versionCount}, from ${time}.`}{' '}
                <span className="color-weak">
                    {c('collider_2025:Info').t`${LUMO_SHORT_APP_NAME} and edits change the latest version.`}
                </span>
            </span>
            <Button size="small" shape="outline" color="weak" className="shrink-0" onClick={onViewLatest}>
                {c('collider_2025:Action').t`View latest`}
            </Button>
        </div>
    );
};
