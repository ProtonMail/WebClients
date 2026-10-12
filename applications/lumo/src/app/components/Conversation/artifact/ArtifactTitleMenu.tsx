import { useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { IconName } from '../../LumoIcon/LumoIcon';
import type { ArtifactVersion } from './artifactRegistry';
import {
    formatArtifactVersionTime,
    getArtifactVersionDescription,
    getArtifactVersionMeta,
} from './artifactVersionLabels';

const MENU_SIZE: DropdownSize = { width: '20rem', maxHeight: '32rem' };
const SUBMENU_SIZE: DropdownSize = { width: '16rem', maxHeight: '24rem' };

export interface ArtifactMenuFormatOption {
    key: string;
    label: string;
    /** Shown on the right of the row, e.g. ".md". */
    extension: string;
    icon: IconName;
    onSelect: () => void;
}

type Submenu = 'download' | 'drive';

const Divider = () => {
    return <hr className="border-weak mx-2 my-1" />;
};

interface SectionLabelProps {
    children: string;
}

const SectionLabel = ({ children }: SectionLabelProps) => {
    return <div className="px-4 pt-2 pb-1 text-sm color-hint">{children}</div>;
};

interface FormatOptionsProps {
    options: ArtifactMenuFormatOption[];
    onSelected: () => void;
}

const FormatOptions = ({ options, onSelected }: FormatOptionsProps) => {
    return (
        <DropdownMenu>
            {options.map((option) => {
                return (
                    <DropdownMenuButton
                        key={option.key}
                        className="text-left flex flex-nowrap items-center gap-3"
                        onClick={() => {
                            option.onSelect();
                            onSelected();
                        }}
                    >
                        <LumoIcon name={option.icon} size={16} className="shrink-0 color-weak" />
                        <span className="flex-1 min-w-0 text-ellipsis">{option.label}</span>
                        <span className="shrink-0 color-hint">{option.extension}</span>
                    </DropdownMenuButton>
                );
            })}
        </DropdownMenu>
    );
};

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
 * made each one), then copy, download, save to Drive and edit. On desktop the Download and Drive
 * rows open flyouts; on small or touch screens they open a page inside the same menu instead.
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
    const { isSmallScreen } = useIsLumoSmallScreen();
    const isTouchDevice = useIsTouchDevice();
    const showSubmenusAsPages = isSmallScreen || isTouchDevice;
    const [openSubmenu, setOpenSubmenu] = useState<Submenu | null>(null);
    // A flyout opened from the keyboard takes focus so arrow keys move through it; one opened by
    // hover leaves focus where it is.
    const [submenuHasFocus, setSubmenuHasFocus] = useState(false);
    const menuContentRef = useRef<HTMLDivElement>(null);
    const submenuContentRef = useRef<HTMLDivElement>(null);
    const downloadRowRef = useRef<HTMLButtonElement>(null);
    const driveRowRef = useRef<HTMLButtonElement>(null);

    const openSubmenuWith = (submenu: Submenu | null, withFocus = false) => {
        setOpenSubmenu(submenu);
        setSubmenuHasFocus(withFocus);
    };

    const closeAll = () => {
        openSubmenuWith(null);
        close();
    };

    // The menu and its flyout are separate popovers, so the dropdowns' own outside-click handling
    // would close the menu on any click in the flyout. One handler covers both instead.
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInside = [anchorRef.current, menuContentRef.current, submenuContentRef.current].some((element) => {
                return element?.contains(target);
            });
            if (!isInside) {
                setOpenSubmenu(null);
                close();
            }
        };
        // Attached on the next tick, like Dropdown, so the click that opened the menu doesn't close it.
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClick, { capture: true });
        }, 0);
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClick, { capture: true });
        };
    }, [isOpen, close, anchorRef]);

    const latestIndex = versions.length - 1;
    // Newest first, keeping each version's index in the registry.
    const entries = versions
        .map((version, index) => {
            return { version, index };
        })
        .reverse();
    const now = new Date();
    const hasDownloadSubmenu = downloadOptions.length > 1;
    const singleDownload = downloadOptions.length === 1 ? downloadOptions[0] : undefined;

    const submenuOptions = openSubmenu === 'drive' ? saveToDriveOptions : downloadOptions;
    const submenuLabel =
        openSubmenu === 'drive' ? c('collider_2025:Title').t`Save as` : c('collider_2025:Title').t`Download as`;
    const submenuAnchorRef = openSubmenu === 'drive' ? driveRowRef : downloadRowRef;

    const getSubmenuRowProps = (submenu: Submenu) => {
        return {
            'aria-haspopup': 'menu' as const,
            'aria-expanded': openSubmenu === submenu,
            onClick: (event: React.MouseEvent) => {
                // A keyboard "click" (Enter/Space) reports no pointer position.
                const fromKeyboard = event.detail === 0;
                openSubmenuWith(openSubmenu === submenu && !fromKeyboard ? null : submenu, fromKeyboard);
            },
            onMouseEnter: showSubmenusAsPages
                ? undefined
                : () => {
                      openSubmenuWith(submenu);
                  },
            onKeyDown: (event: React.KeyboardEvent) => {
                if (!showSubmenusAsPages && event.key === 'ArrowRight') {
                    event.preventDefault();
                    openSubmenuWith(submenu, true);
                }
            },
        };
    };

    // Hovering a plain row closes an open flyout, like a native menu.
    const closeSubmenuOnHover = showSubmenusAsPages
        ? undefined
        : () => {
              openSubmenuWith(null);
          };

    const renderMainMenu = () => {
        return (
            <>
                <SectionLabel>{c('collider_2025:Title').t`Versions`}</SectionLabel>
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
                                onMouseEnter={closeSubmenuOnHover}
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
                <Divider />
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center gap-3"
                        disabled={actionsDisabled}
                        onMouseEnter={closeSubmenuOnHover}
                        onClick={() => {
                            onCopy();
                            closeAll();
                        }}
                    >
                        <LumoIcon name="Copy" size={16} className="shrink-0 color-weak" />
                        <span className="flex-1">{c('collider_2025:Action').t`Copy`}</span>
                        <span className="shrink-0 color-hint">{copyShortcutLabel}</span>
                    </DropdownMenuButton>
                    {hasDownloadSubmenu && (
                        <DropdownMenuButton
                            ref={downloadRowRef}
                            className={clsx(
                                'text-left flex flex-nowrap items-center gap-3',
                                openSubmenu === 'download' && 'bg-weak'
                            )}
                            disabled={actionsDisabled}
                            {...getSubmenuRowProps('download')}
                        >
                            <LumoIcon name="Download" size={16} className="shrink-0 color-weak" />
                            <span className="flex-1">{c('collider_2025:Action').t`Download`}</span>
                            <LumoIcon name="ChevronRight" size={16} className="shrink-0 color-weak" />
                        </DropdownMenuButton>
                    )}
                    {singleDownload && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center gap-3"
                            disabled={actionsDisabled}
                            onMouseEnter={closeSubmenuOnHover}
                            onClick={() => {
                                singleDownload.onSelect();
                                closeAll();
                            }}
                        >
                            <LumoIcon name="Download" size={16} className="shrink-0 color-weak" />
                            <span className="flex-1">{c('collider_2025:Action').t`Download`}</span>
                            <span className="shrink-0 color-hint">{singleDownload.extension}</span>
                        </DropdownMenuButton>
                    )}
                    {saveToDriveOptions.length > 0 && (
                        <DropdownMenuButton
                            ref={driveRowRef}
                            className={clsx(
                                'text-left flex flex-nowrap items-center gap-3',
                                openSubmenu === 'drive' && 'bg-weak'
                            )}
                            disabled={actionsDisabled}
                            {...getSubmenuRowProps('drive')}
                        >
                            <LumoIcon name="Folder" size={16} className="shrink-0 color-weak" />
                            <span className="flex-1">{c('collider_2025:Action').t`Save to ${DRIVE_APP_NAME}`}</span>
                            <LumoIcon name="ChevronRight" size={16} className="shrink-0 color-weak" />
                        </DropdownMenuButton>
                    )}
                    {onEdit && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center gap-3"
                            disabled={actionsDisabled}
                            onMouseEnter={closeSubmenuOnHover}
                            onClick={() => {
                                onEdit();
                                closeAll();
                            }}
                        >
                            <LumoIcon name="Pencil" size={16} className="shrink-0 color-weak" />
                            <span className="flex-1">{c('collider_2025:Action').t`Edit`}</span>
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </>
        );
    };

    // Small and touch screens: the submenu replaces the menu's content, with a row back.
    const renderSubmenuPage = () => {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center gap-3"
                        onClick={() => {
                            openSubmenuWith(null);
                        }}
                    >
                        <LumoIcon name="ChevronLeft" size={16} className="shrink-0 color-weak" />
                        <span className="flex-1 text-semibold">{submenuLabel}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
                <Divider />
                <FormatOptions options={submenuOptions} onSelected={closeAll} />
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
                    openSubmenuWith(null);
                    toggle();
                }}
            >
                <span className="text-semibold text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
                    {title}
                    {typeLabel && <span className="color-hint font-normal">{` · ${typeLabel}`}</span>}
                </span>
                <LumoIcon name="ChevronDown" size={16} className="shrink-0 color-weak" />
            </Button>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={closeAll}
                size={MENU_SIZE}
                className="chat-dropdown-menu"
                originalPlacement="bottom-start"
                autoClose={false}
                autoCloseOutside={false}
                contentProps={{ ref: menuContentRef }}
            >
                {showSubmenusAsPages && openSubmenu ? renderSubmenuPage() : renderMainMenu()}
            </Dropdown>
            {!showSubmenusAsPages && (
                <Dropdown
                    isOpen={isOpen && openSubmenu !== null}
                    anchorRef={submenuAnchorRef}
                    onClose={() => {
                        openSubmenuWith(null);
                    }}
                    size={SUBMENU_SIZE}
                    className="chat-dropdown-menu"
                    originalPlacement="right-start"
                    availablePlacements={['right-start', 'left-start']}
                    noCaret
                    autoClose={false}
                    autoCloseOutside={false}
                    disableFocusTrap={!submenuHasFocus}
                    contentProps={{
                        ref: submenuContentRef,
                        onKeyDown: (event) => {
                            if (event.key === 'ArrowLeft') {
                                event.preventDefault();
                                openSubmenuWith(null);
                            }
                        },
                    }}
                >
                    <SectionLabel>{submenuLabel}</SectionLabel>
                    <FormatOptions options={submenuOptions} onSelected={closeAll} />
                </Dropdown>
            )}
        </>
    );
};
