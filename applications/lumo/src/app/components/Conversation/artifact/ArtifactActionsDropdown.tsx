import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { IconName } from '../../LumoIcon/LumoIcon';

const SUBMENU_SIZE: DropdownSize = { width: '16rem', maxHeight: '24rem' };

export interface ArtifactMenuFormatOption {
    key: string;
    label: string;
    /** Shown on the right of the row, e.g. ".md". */
    extension: string;
    icon: IconName;
    onSelect: () => void;
}

export interface ArtifactMenuAction {
    key: string;
    label: string;
    icon: IconName;
    /** Shown on the right of the row, e.g. a keyboard shortcut. */
    hint?: string;
    onSelect: () => void;
}

/** Lets rows rendered by the caller close the menu and the flyout like the built-in rows do. */
export interface ArtifactMenuControls {
    closeAll: () => void;
    onRowHover?: () => void;
}

type Submenu = 'download' | 'drive';

export const ArtifactMenuDivider = () => {
    return <hr className="border-weak mx-2 my-1" />;
};

interface SectionLabelProps {
    children: string;
}

export const ArtifactMenuSectionLabel = ({ children }: SectionLabelProps) => {
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
    anchorRef: RefObject<HTMLElement>;
    isOpen: boolean;
    onClose: () => void;
    size: DropdownSize;
    originalPlacement?: PopperPlacement;
    /** Rendered above the actions, followed by a divider (the title menu's version list). */
    header?: (controls: ArtifactMenuControls) => ReactNode;
    /** Rows before Download. */
    leadingActions?: ArtifactMenuAction[];
    /** One option downloads directly from the row; several open a "Download as" submenu. */
    downloadOptions: ArtifactMenuFormatOption[];
    /** Empty when the artifact type (or a guest) can't save to Drive. */
    saveToDriveOptions: ArtifactMenuFormatOption[];
    /** Rows after Save to Drive. */
    trailingActions?: ArtifactMenuAction[];
    /** An export is running: file actions wait until it finishes. */
    actionsDisabled?: boolean;
}

/**
 * The artifact actions menu: optional header, then copy-style rows, Download, Save to Drive and
 * any trailing rows. On desktop the Download and Drive rows open flyouts; on small or touch screens
 * they open a page inside the same menu instead. The caller owns the anchor and the open state.
 */
export const ArtifactActionsDropdown = ({
    anchorRef,
    isOpen,
    onClose,
    size,
    originalPlacement = 'bottom-start',
    header,
    leadingActions = [],
    downloadOptions,
    saveToDriveOptions,
    trailingActions = [],
    actionsDisabled,
}: Props) => {
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
        onClose();
    };

    // Every open starts on the main menu.
    useEffect(() => {
        if (!isOpen) {
            setOpenSubmenu(null);
        }
    }, [isOpen]);

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
                onClose();
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
    }, [isOpen, onClose, anchorRef]);

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

    const renderActionRow = (action: ArtifactMenuAction) => {
        return (
            <DropdownMenuButton
                key={action.key}
                className="text-left flex flex-nowrap items-center gap-3"
                disabled={actionsDisabled}
                onMouseEnter={closeSubmenuOnHover}
                onClick={() => {
                    action.onSelect();
                    closeAll();
                }}
            >
                <LumoIcon name={action.icon} size={16} className="shrink-0 color-weak" />
                <span className="flex-1">{action.label}</span>
                {action.hint && <span className="shrink-0 color-hint">{action.hint}</span>}
            </DropdownMenuButton>
        );
    };

    const renderMainMenu = () => {
        return (
            <>
                {header && (
                    <>
                        {header({ closeAll, onRowHover: closeSubmenuOnHover })}
                        <ArtifactMenuDivider />
                    </>
                )}
                <DropdownMenu>
                    {leadingActions.map(renderActionRow)}
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
                    {trailingActions.map(renderActionRow)}
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
                <ArtifactMenuDivider />
                <FormatOptions options={submenuOptions} onSelected={closeAll} />
            </>
        );
    };

    return (
        <>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={closeAll}
                size={size}
                className="chat-dropdown-menu"
                originalPlacement={originalPlacement}
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
                    <ArtifactMenuSectionLabel>{submenuLabel}</ArtifactMenuSectionLabel>
                    <FormatOptions options={submenuOptions} onSelected={closeAll} />
                </Dropdown>
            )}
        </>
    );
};
