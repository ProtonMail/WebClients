import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';
import {
    getDesktopConnectors,
    openDesktopSettings,
    setDesktopConnectorEnabled,
    subscribeDesktopConnectors,
} from '@proton/lumo-api-client/core/desktop-tools';

import { LumoIcon } from '../LumoIcon/LumoIcon';

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

export const ConnectorList = ({ onBack }: { onBack: () => void }) => {
    const { connectors, toggle } = useDesktopConnectors(true);
    const { createNotification } = useNotifications();
    const available = connectors.filter((c) => c.connected);

    const handleManage = async () => {
        try {
            await openDesktopSettings('connectors');
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Could not open the desktop settings`,
            });
        }
    };

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
            <hr className="my-1 w-custom mx-auto" style={{ '--w-custom': '90%' }} />
            <DropdownMenuButton className="justify-start" onClick={handleManage}>
                <div className="flex items-center gap-3 w-full">
                    <span className="shrink-0 flex">
                        <LumoIcon name="Settings" size={16} />
                    </span>
                    <span className="text-sm font-medium flex-1 text-left">{c('collider_2025: Action')
                        .t`Manage connectors`}</span>
                </div>
            </DropdownMenuButton>
        </>
    );
};
