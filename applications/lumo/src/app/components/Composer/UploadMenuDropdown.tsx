import { useEffect, useState } from 'react';

import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import type { DesktopConnector } from '../../lib/lumo-api-client/core/desktop-tools';
import {
    getDesktopConnectors,
    isDesktopEnvironment,
    setDesktopConnectorEnabled,
    subscribeDesktopConnectors,
} from '../../lib/lumo-api-client/core/desktop-tools';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import type { MenuDropdownProps, MenuItemProps } from './components/MenuDropdown';
import { MenuDropdown, MenuItem } from './components/MenuDropdown';
import type { FileUploadMode } from './hooks/useFileHandling';

import './UploadMenuDropdown.scss';

interface UploadActionItemProps extends MenuItemProps {
    canShow: boolean;
}

interface UploadMenuDropdownProps extends Pick<MenuDropdownProps, 'isOpen' | 'anchorRef' | 'onClose'> {
    onUploadFromComputer: () => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    fileUploadMode: FileUploadMode;
    isAgent?: boolean;
}

const useDesktopConnectors = (active: boolean) => {
    const [connectors, setConnectors] = useState<DesktopConnector[]>([]);

    useEffect(() => {
        if (!active) {
            return;
        }
        const load = () => {
            void getDesktopConnectors().then(setConnectors);
        };
        load();
        return subscribeDesktopConnectors(load);
    }, [active]);

    const toggle = (connector: DesktopConnector) => {
        const next = !connector.enabled;
        setConnectors((prev) => prev.map((c) => (c.id === connector.id ? { ...c, enabled: next } : c)));
        void setDesktopConnectorEnabled(connector.id, next);
    };

    return { connectors, toggle };
};

const ConnectorList = ({ onBack }: { onBack: () => void }) => {
    const { connectors, toggle } = useDesktopConnectors(true);
    const available = connectors.filter((c) => c.connected);

    return (
        <>
            <DropdownMenuButton className="justify-start" onClick={onBack}>
                <div className="flex items-center gap-2 w-full">
                    <LumoIcon name="ChevronLeft" size={16} />
                    <span className="text-sm font-medium">{c('collider_2025: Action').t`Connectors`}</span>
                </div>
            </DropdownMenuButton>
            {available.length === 0 && (
                <div className="px-4 py-2 text-xs color-hint">{c('collider_2025: Info')
                    .t`No connected connectors`}</div>
            )}
            {available.map((connector) => (
                <DropdownMenuButton key={connector.id} className="justify-start" onClick={() => toggle(connector)}>
                    <div
                        className="flex flex-nowrap items-center gap-3 w-full"
                        style={{ opacity: connector.enabled ? 1 : 0.4 }}
                    >
                        <span className="shrink-0 flex items-center">
                            {connector.icon ? (
                                <img src={connector.icon} alt="" width={20} height={20} />
                            ) : (
                                <LumoIcon name="Blocks" size={20} />
                            )}
                        </span>
                        <span className="text-sm font-medium flex-1 min-w-0 text-ellipsis text-left">
                            {connector.display_name}
                        </span>
                        <span className="text-xs color-hint shrink-0">
                            {connector.enabled
                                ? c('collider_2025: Info').t`Enabled`
                                : c('collider_2025: Info').t`Disabled`}
                        </span>
                    </div>
                </DropdownMenuButton>
            ))}
        </>
    );
};

export const UploadMenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onUploadFromComputer,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
    isAgent = false,
}: UploadMenuDropdownProps) => {
    const { imageTools: ffImageToolsEnabled } = useLumoFlags();
    const [view, setView] = useState<'main' | 'connectors'>('main');
    const showConnectors = isDesktopEnvironment();

    useEffect(() => {
        if (!isOpen) {
            setView('main');
        }
    }, [isOpen]);

    // Show "Add from Drive" browse option only for authenticated users without a linked folder and guest users (will trigger upsell)
    // The agent surface keeps the composer minimal, so Drive browsing is hidden there.
    const showBrowseDriveOption = fileUploadMode !== 'linked-drive' && !isAgent;
    // If drive folder linked, uploads should go to drive, otherwise they will be handled locally
    const showUploadToDrive = fileUploadMode === 'linked-drive';

    const uploadMenuItems: UploadActionItemProps[] = [
        {
            icon: <IcBrandProtonDrive size={4} />,
            getLabel: () => c('collider_2025: UploadAction').t`Add from ${DRIVE_APP_NAME}`,
            onClick: onBrowseDrive,
            onClose: onClose,
            canShow: showBrowseDriveOption,
        },
        {
            icon: showUploadToDrive ? <IcBrandProtonDriveFilled size={4} /> : <LumoIcon name="Upload" size={16} />,
            getLabel: () =>
                showUploadToDrive
                    ? c('collider_2025: Action').t`Add file to ${DRIVE_APP_NAME}`
                    : c('collider_2025: Action').t`Upload from device`,
            onClick: onUploadFromComputer,
            onClose: onClose,
            canShow: true,
        },
        {
            icon: <LumoIcon name="Pencil" size={16} />,
            getLabel: () => c('collider_2025: Action').t`Draw a sketch`,
            onClick: onDrawSketch,
            onClose: onClose,
            canShow: ffImageToolsEnabled && !isAgent,
        },
    ].filter((item) => item.canShow);

    return (
        <MenuDropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            autoClose={false}
            className="upload-menu-dropdown rounded-xl"
        >
            {view === 'connectors' ? (
                <ConnectorList onBack={() => setView('main')} />
            ) : (
                <>
                    {uploadMenuItems.map((item, index) => (
                        <MenuItem key={index} {...item} />
                    ))}
                    {showConnectors && (
                        <DropdownMenuButton className="justify-start" onClick={() => setView('connectors')}>
                            <div className="flex items-center gap-3 w-full">
                                <span className="shrink-0 flex">
                                    <LumoIcon name="Blocks" size={16} />
                                </span>
                                <span className="text-sm font-medium flex-1 text-left">{c('collider_2025: Action')
                                    .t`Connectors`}</span>
                                <LumoIcon name="ChevronRight" size={16} />
                            </div>
                        </DropdownMenuButton>
                    )}
                </>
            )}
        </MenuDropdown>
    );
};
