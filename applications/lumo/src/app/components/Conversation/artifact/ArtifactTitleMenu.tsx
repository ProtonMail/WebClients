import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import { LumoIcon } from '../../LumoIcon/LumoIcon';
import { ArtifactActionsDropdown, ArtifactMenuSectionLabel } from './ArtifactActionsDropdown';
import type { ArtifactMenuAction, ArtifactMenuControls, ArtifactMenuFormatOption } from './ArtifactActionsDropdown';
import type { ArtifactVersion } from './artifactRegistry';
import {
    formatArtifactVersionTime,
    getArtifactVersionDescription,
    getArtifactVersionMeta,
} from './artifactVersionLabels';

const MENU_SIZE: DropdownSize = { width: '20rem', maxHeight: '32rem' };

interface Props {
    title: string;
    /** Secondary label after the title, e.g. the language of a code artifact. */
    typeLabel?: string;
    versions: ArtifactVersion[];
    selectedIndex: number;
    onOpen: () => void;
    onSelectVersion: (index: number) => void;
    onCopy: () => void;
    copyShortcutLabel: string;
    /** One option downloads directly from the row; several open a "Download as" submenu. */
    downloadOptions: ArtifactMenuFormatOption[];
    /** Empty when the artifact type (or a guest) can't save to Drive. */
    saveToDriveOptions: ArtifactMenuFormatOption[];
    /** Absent when the shown version can't be edited by hand. */
    onEdit?: () => void;
    /** An export is running: file actions wait until it finishes. */
    actionsDisabled?: boolean;
}

/**
 * The panel header's title, which opens the artifact menu: its versions (newest first, with who
 * made each one), then copy, download, save to Drive and edit.
 */
export const ArtifactTitleMenu = ({
    title,
    typeLabel,
    versions,
    selectedIndex,
    onOpen,
    onSelectVersion,
    onCopy,
    copyShortcutLabel,
    downloadOptions,
    saveToDriveOptions,
    onEdit,
    actionsDisabled,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const latestIndex = versions.length - 1;
    // Newest first, keeping each version's index in the registry.
    const entries = versions
        .map((version, index) => {
            return { version, index };
        })
        .reverse();
    const now = new Date();

    const leadingActions: ArtifactMenuAction[] = [
        {
            key: 'copy',
            label: c('collider_2025:Action').t`Copy`,
            icon: 'Copy',
            hint: copyShortcutLabel,
            onSelect: onCopy,
        },
    ];
    const trailingActions: ArtifactMenuAction[] = onEdit
        ? [{ key: 'edit', label: c('collider_2025:Action').t`Edit`, icon: 'Pencil', onSelect: onEdit }]
        : [];

    const renderVersions = ({ closeAll, onRowHover }: ArtifactMenuControls) => {
        return (
            <>
                <ArtifactMenuSectionLabel>{c('collider_2025:Title').t`Versions`}</ArtifactMenuSectionLabel>
                <DropdownMenu>
                    {entries.map(({ version, index }) => {
                        const isSelected = index === selectedIndex;
                        const versionTitle = version.title ?? title;
                        const description = getArtifactVersionDescription(version, index);
                        const time = formatArtifactVersionTime(version.createdAt);
                        return (
                            <DropdownMenuButton
                                key={version.messageId}
                                className={clsx(
                                    'text-left flex flex-nowrap items-center gap-3',
                                    isSelected && 'bg-weak'
                                )}
                                aria-current={isSelected ? 'true' : undefined}
                                title={`${description} · ${time}`}
                                onMouseEnter={onRowHover}
                                onClick={() => {
                                    onSelectVersion(index);
                                    closeAll();
                                }}
                            >
                                <span className="shrink-0 w-custom flex" style={{ '--w-custom': '1rem' }}>
                                    {isSelected && <IcCheckmark size={4} className="color-primary" />}
                                </span>
                                <span className="flex-1 min-w-0 text-ellipsis color-norm">
                                    {`v${index + 1} · ${versionTitle}`}
                                    {index === latestIndex && versions.length > 1 && (
                                        <span className="sr-only">{` ${c('collider_2025:Info').t`(latest)`}`}</span>
                                    )}
                                </span>
                                <span className="shrink-0 text-sm color-hint">
                                    {getArtifactVersionMeta(version, now)}
                                </span>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </>
        );
    };

    return (
        <>
            <Button
                ref={anchorRef}
                shape="ghost"
                color="weak"
                size="small"
                className="artifact-btn flex flex-row flex-nowrap items-center gap-1 min-w-0 text-left color-norm"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title={c('collider_2025:Action').t`Versions and actions`}
                onClick={() => {
                    if (!isOpen) {
                        onOpen();
                    }
                    toggle();
                }}
            >
                <span className="text-semibold text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
                    {title}
                    {typeLabel && <span className="color-hint font-normal">{` · ${typeLabel}`}</span>}
                </span>
                <LumoIcon name="ChevronDown" size={16} className="shrink-0 color-weak" />
            </Button>
            <ArtifactActionsDropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                size={MENU_SIZE}
                header={renderVersions}
                leadingActions={leadingActions}
                downloadOptions={downloadOptions}
                saveToDriveOptions={saveToDriveOptions}
                trailingActions={trailingActions}
                actionsDisabled={actionsDisabled}
            />
        </>
    );
};
