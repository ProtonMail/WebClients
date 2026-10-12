import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { ArtifactVersion } from './artifactRegistry';
import {
    formatArtifactVersionTime,
    getArtifactVersionAuthor,
    getArtifactVersionDescription,
} from './artifactVersionLabels';

const DROPDOWN_SIZE: DropdownSize = { width: '20rem', maxHeight: '24rem' };

interface VersionAvatarProps {
    version: ArtifactVersion;
}

const VersionAvatar = ({ version }: VersionAvatarProps) => {
    if (version.source === 'manual-edit') {
        return (
            <span
                className="shrink-0 flex items-center justify-center rounded-full bg-weak color-weak w-custom h-custom"
                style={{ '--w-custom': '1.25rem', '--h-custom': '1.25rem' }}
                aria-hidden="true"
            >
                <LumoIcon name="User" size={12} />
            </span>
        );
    }
    return (
        <img
            src={lumoCatIcon}
            alt=""
            className="shrink-0 w-custom h-custom"
            style={{ '--w-custom': '1.25rem', '--h-custom': '1.25rem' }}
        />
    );
};

const getTriggerLabel = (versionNumber: number, versionCount: number): string => {
    if (versionNumber === versionCount) {
        return c('collider_2025:Info').t`v${versionNumber} · Latest`;
    }
    return c('collider_2025:Info').t`v${versionNumber} of ${versionCount}`;
};

interface Props {
    versions: ArtifactVersion[];
    selectedIndex: number;
    onOpen: () => void;
    onSelectVersion: (index: number) => void;
}

/**
 * The header's version control: shows which version is on screen and opens the artifact's history,
 * newest first, with who made each version, when, and what the user asked for.
 */
export const ArtifactVersionHistoryDropdown = ({ versions, selectedIndex, onOpen, onSelectVersion }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const latestIndex = versions.length - 1;
    const triggerLabel = getTriggerLabel(selectedIndex + 1, versions.length);

    // Newest first, keeping each version's index in the registry.
    const entries = versions
        .map((version, index) => {
            return { version, index };
        })
        .reverse();

    return (
        <>
            <Button
                ref={anchorRef}
                shape="ghost"
                color="weak"
                size="small"
                className="artifact-btn shrink-0 flex flex-nowrap items-center gap-1 text-nowrap"
                title={c('collider_2025:Action').t`Version history`}
                aria-label={c('collider_2025:Action').t`Version history, showing ${triggerLabel}`}
                aria-expanded={isOpen}
                onClick={() => {
                    if (!isOpen) {
                        onOpen();
                    }
                    toggle();
                }}
            >
                <LumoIcon name="RotateCcwClock" size={16} />
                <span>{triggerLabel}</span>
                <LumoIcon name="ChevronDown" size={14} />
            </Button>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={DROPDOWN_SIZE}
                className="chat-dropdown-menu"
                originalPlacement="bottom-end"
            >
                <div className="px-4 pt-3 pb-1 text-sm text-semibold color-norm">
                    {c('collider_2025:Title').t`Version history`}
                </div>
                <DropdownMenu>
                    {entries.map(({ version, index }) => {
                        const isSelected = index === selectedIndex;
                        const isLatest = index === latestIndex;
                        const author = getArtifactVersionAuthor(version);
                        const description = getArtifactVersionDescription(version, index);
                        const time = formatArtifactVersionTime(version.createdAt);
                        return (
                            <DropdownMenuButton
                                key={version.messageId}
                                className={clsx(
                                    'text-left flex flex-nowrap items-start gap-2 py-2',
                                    isSelected && 'bg-weak'
                                )}
                                aria-current={isSelected ? 'true' : undefined}
                                onClick={() => {
                                    onSelectVersion(index);
                                    close();
                                }}
                            >
                                <VersionAvatar version={version} />
                                <span className="flex flex-column flex-nowrap min-w-0 flex-1">
                                    <span className="flex flex-nowrap items-center gap-1 text-sm">
                                        <span className="text-semibold color-norm">{author}</span>
                                        <span className="color-hint">{`· v${index + 1}`}</span>
                                        {isLatest && (
                                            <span className="ml-auto text-xs color-primary shrink-0">
                                                {c('collider_2025:Info').t`Latest`}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-sm color-weak text-ellipsis" title={description}>
                                        {description}
                                    </span>
                                    <span className="text-xs color-hint">{time}</span>
                                </span>
                                <span className="shrink-0 w-custom flex" style={{ '--w-custom': '1rem' }}>
                                    {isSelected && <IcCheckmark size={4} className="color-primary" />}
                                </span>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

interface OlderVersionBannerProps {
    version: ArtifactVersion;
    versionNumber: number;
    versionCount: number;
    onViewLatest: () => void;
}

/**
 * Shown above an older version: everything that changes the artifact (Lumo, inline edits, manual
 * edits) works on the latest version, so the user must not mistake this one for the live copy.
 */
export const ArtifactOlderVersionBanner = ({
    version,
    versionNumber,
    versionCount,
    onViewLatest,
}: OlderVersionBannerProps) => {
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
