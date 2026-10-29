import { useEffect, useId, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';
import {
    getDesktopConnectors,
    isDesktopEnvironment,
    openDesktopSettings,
    setDesktopConnectorEnabled,
    subscribeDesktopConnectors,
} from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { getConnectorStatusLabel } from '../../schedules/components/utils/connectors';
import { DesktopConnectorsNotice } from './DesktopConnectorsNotice';

import './CustomizeConnectorsTab.scss';

const matchesQuery = (connector: DesktopConnector, query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
        return true;
    }
    return connector.display_name.toLowerCase().includes(normalized);
};

interface CustomizeConnectorsTabProps {
    searchQuery: string;
}

export const CustomizeConnectorsTab = ({ searchQuery }: CustomizeConnectorsTabProps) => {
    const [connectors, setConnectors] = useState<DesktopConnector[]>([]);
    const { createNotification } = useNotifications();
    const toggleIdPrefix = useId();

    useEffect(() => {
        const load = () => {
            void getDesktopConnectors().then(setConnectors);
        };
        load();
        return subscribeDesktopConnectors(load);
    }, []);

    const filteredConnectors = useMemo(
        () => connectors.filter((connector) => matchesQuery(connector, searchQuery)),
        [connectors, searchQuery]
    );

    const handleToggle = (connector: DesktopConnector) => {
        const enabled = connector.enabled !== false;
        const next = !enabled;
        setConnectors((prev) => prev.map((item) => (item.id === connector.id ? { ...item, enabled: next } : item)));
        void setDesktopConnectorEnabled(connector.id, next);
    };

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

    if (!isDesktopEnvironment()) {
        return <DesktopConnectorsNotice />;
    }

    return (
        <div className="flex flex-column flex-nowrap gap-6">
            <div className="flex flex-nowrap items-start justify-space-between gap-4">
                <p className="m-0 text-sm color-weak max-w-custom" style={{ '--max-w-custom': '40rem' }}>
                    {c('collider_2025:Info')
                        .t`Connectors let ${LUMO_SHORT_APP_NAME} use tools on this computer. Manage credentials and approval policies in desktop settings.`}
                </p>
                <Button className="shrink-0" color="weak" shape="outline" onClick={handleManage}>
                    {c('collider_2025:Action').t`Manage connectors`}
                </Button>
            </div>

            {filteredConnectors.length === 0 ? (
                <p className="m-0 text-sm color-weak">
                    {searchQuery.trim()
                        ? c('collider_2025:Info').t`No connectors match your search.`
                        : c('collider_2025:Info').t`No connected connectors`}
                </p>
            ) : (
                <ul className="customize-connectors-list m-0 p-0 list-none flex flex-column flex-nowrap">
                    {filteredConnectors.map((connector) => {
                        const enabled = connector.enabled !== false;
                        return (
                            <li
                                key={connector.id}
                                className="customize-connectors-list__row flex flex-nowrap items-center gap-4 border-bottom border-weak"
                            >
                                <span className="customize-connectors-list__icon shrink-0 flex items-center justify-center">
                                    {connector.icon ? (
                                        <img src={connector.icon} alt="" width={20} height={20} />
                                    ) : (
                                        <LumoIcon name="Blocks" size={20} />
                                    )}
                                </span>
                                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                                    <span className="text-semibold text-ellipsis">{connector.display_name}</span>
                                    <span className="text-sm color-weak text-ellipsis">
                                        {getConnectorStatusLabel(connector)}
                                    </span>
                                </div>
                                <Toggle
                                    id={`${toggleIdPrefix}-${connector.id}`}
                                    checked={enabled}
                                    className="shrink-0"
                                    onChange={() => handleToggle(connector)}
                                    title={c('collider_2025:Action').t`Enable connector`}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
