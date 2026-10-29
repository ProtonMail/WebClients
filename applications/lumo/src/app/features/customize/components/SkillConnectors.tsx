import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { openDesktopSettings } from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import {
    type SkillCategoryMatch,
    type SkillConnectorMatch,
    type SkillConnectorMatches,
    getConnectedForCategory,
} from '../../skills/connectorMatching';
import { DesktopConnectorsNotice } from './DesktopConnectorsNotice';

import './SkillConnectors.scss';

const MAX_ASIDE_CONNECTORS = 6;

const useOpenConnectorSettings = () => {
    const { createNotification } = useNotifications();
    return async (connectorId?: string) => {
        try {
            await openDesktopSettings('connectors', connectorId);
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025:Error').t`Could not open the desktop settings`,
            });
        }
    };
};

const ConnectorStatus = ({
    match,
    onOpenSettings,
}: {
    match: SkillConnectorMatch;
    onOpenSettings: (connectorId?: string) => void;
}) => {
    switch (match.status) {
        case 'connected':
            return (
                <span className="skill-connector__status is-connected flex flex-nowrap items-center gap-1 text-sm">
                    <LumoIcon aria-hidden name="CircleCheck" size={14} />
                    {c('collider_2025:Label').t`Connected`}
                </span>
            );
        case 'needs-attention':
            return (
                <Button size="small" shape="outline" onClick={() => onOpenSettings(match.connectorId)}>
                    {c('collider_2025:Action').t`Set up`}
                </Button>
            );
        case 'available':
            return (
                <Button size="small" color="norm" onClick={() => onOpenSettings(match.connectorId)}>
                    {c('collider_2025:Action').t`Connect`}
                </Button>
            );
        case 'unavailable':
            return (
                <span className="text-sm color-weak">{c('collider_2025:Label')
                    .t`Not available in ${LUMO_SHORT_APP_NAME}`}</span>
            );
    }
};

const ConnectorRow = ({
    match,
    note,
    status,
    capitalize,
}: {
    match: SkillConnectorMatch;
    note?: string;
    status?: ReactNode;
    /** For `.mcp.json` server keys, which are usually lowercase. */
    capitalize?: boolean;
}) => {
    const desktopName = match.desktopName && match.desktopName !== match.name ? match.desktopName : undefined;
    const detail = [desktopName, note].filter(Boolean).join(' · ');
    return (
        <li
            className={clsx(
                'skill-detail__row flex flex-nowrap items-center gap-4',
                status && match.status === 'unavailable' && 'skill-connector__row--unavailable'
            )}
        >
            <div className="skill-detail__connector-icon flex shrink-0 items-center justify-center">
                <LumoIcon aria-hidden name="Blocks" size={16} />
            </div>
            <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                <span className={clsx('text-semibold text-ellipsis', capitalize && 'text-capitalize')}>
                    {match.name}
                </span>
                {detail && <span className="text-sm color-weak text-ellipsis">{detail}</span>}
            </div>
            {status && <div className="shrink-0">{status}</div>}
        </li>
    );
};

const CategorySection = ({
    match,
    isDesktop,
    onOpenSettings,
}: {
    match: SkillCategoryMatch;
    isDesktop: boolean;
    onOpenSettings: (connectorId?: string) => void;
}) => {
    const { category, connectors, otherConnected, suggested } = match;
    const covered = getConnectedForCategory(match).length > 0;
    const statusOf = (connector: SkillConnectorMatch) =>
        isDesktop ? <ConnectorStatus match={connector} onOpenSettings={onOpenSettings} /> : undefined;
    const pluginName = connectors.map(({ name }) => name).join(', ');

    return (
        <section className="flex flex-column flex-nowrap gap-1">
            <h3 className="text-rg text-semibold m-0 flex flex-nowrap items-center gap-2">
                {category.name}
                {category.placeholder && (
                    <code className="skill-detail__handle text-sm text-normal">{category.placeholder}</code>
                )}
            </h3>
            <ul className="m-0 p-0 list-none">
                {connectors.map((connector) => (
                    <ConnectorRow
                        key={connector.connectorId ?? connector.name}
                        match={connector}
                        status={statusOf(connector)}
                    />
                ))}
                {isDesktop &&
                    otherConnected.map((connector) => (
                        <ConnectorRow
                            key={connector.connectorId}
                            match={connector}
                            note={
                                pluginName
                                    ? c('collider_2025:Info').t`Can stand in for ${pluginName}`
                                    : c('collider_2025:Info').t`Works for this category`
                            }
                            status={statusOf(connector)}
                        />
                    ))}
                {isDesktop &&
                    !covered &&
                    suggested.map((connector) => (
                        <ConnectorRow
                            key={connector.connectorId}
                            match={connector}
                            note={c('collider_2025:Info').t`Also works for this category`}
                            status={statusOf(connector)}
                        />
                    ))}
            </ul>
        </section>
    );
};

export const SkillConnectorsTab = ({ matches, isDesktop }: { matches: SkillConnectorMatches; isDesktop: boolean }) => {
    const openSettings = useOpenConnectorSettings();
    const onOpenSettings = (connectorId?: string) => {
        void openSettings(connectorId);
    };

    return (
        <div className="flex flex-column flex-nowrap gap-6">
            {!isDesktop && <DesktopConnectorsNotice />}
            <p className="m-0 text-sm color-weak">
                {c('collider_2025:Info')
                    .t`This plugin works best with these kinds of tools. ${LUMO_SHORT_APP_NAME} only uses the connectors you add yourself.`}
                {isDesktop && (
                    <>
                        {' '}
                        <Link to="/customize?tab=connectors">{c('collider_2025:Link').t`Manage connectors`}</Link>
                    </>
                )}
            </p>
            {matches.categories.map((match) => (
                <CategorySection
                    key={match.category.name}
                    match={match}
                    isDesktop={isDesktop}
                    onOpenSettings={onOpenSettings}
                />
            ))}
            {matches.servers.length > 0 && (
                <section className="flex flex-column flex-nowrap gap-1">
                    {matches.categories.length > 0 && (
                        <h3 className="text-rg text-semibold m-0">{c('collider_2025:Title').t`Other connectors`}</h3>
                    )}
                    <ul className="m-0 p-0 list-none">
                        {matches.servers.map((server) => (
                            <ConnectorRow
                                key={server.name}
                                match={server}
                                capitalize
                                status={
                                    isDesktop ? (
                                        <ConnectorStatus match={server} onOpenSettings={onOpenSettings} />
                                    ) : undefined
                                }
                            />
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

/** Every connector the plugin names, plus the connected ones standing in for its categories. */
const listAsideConnectors = (matches: SkillConnectorMatches): SkillConnectorMatch[] => {
    const seen = new Set<string>();
    return [
        ...matches.categories.flatMap((match) => [...match.connectors, ...match.otherConnected]),
        ...matches.servers,
    ].filter((connector) => {
        const key = connector.connectorId ?? connector.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const SkillConnectorsAside = ({
    matches,
    isDesktop,
    onViewAll,
}: {
    matches: SkillConnectorMatches;
    isDesktop: boolean;
    onViewAll: () => void;
}) => {
    const connectors = listAsideConnectors(matches);
    if (!connectors.length) {
        return null;
    }
    const connectedCount = connectors.filter(({ status }) => status === 'connected').length;
    const total = connectors.length;
    const dataNote = c('collider_2025:Info').t`Connectors can send your data to other services.`;

    return (
        <section className="flex flex-column flex-nowrap gap-2">
            <h2 className="text-sm color-weak text-normal m-0 flex flex-nowrap items-center gap-1">
                {c('collider_2025:Title').t`Connectors & tools`}
                <Tooltip title={dataNote}>
                    <span className="flex" tabIndex={0} aria-label={dataNote}>
                        <LumoIcon aria-hidden name="Info" size={14} />
                    </span>
                </Tooltip>
            </h2>
            {isDesktop && (
                <p className="m-0 text-sm color-weak">
                    {c('collider_2025:Info').t`${connectedCount} of ${total} connected`}
                </p>
            )}
            <ul className="m-0 p-0 list-none flex flex-column flex-nowrap gap-1">
                {connectors.slice(0, MAX_ASIDE_CONNECTORS).map((connector) => (
                    <li
                        key={connector.connectorId ?? connector.name}
                        className="flex flex-nowrap items-center gap-2 text-sm"
                    >
                        <LumoIcon aria-hidden name="Blocks" size={14} className="shrink-0 color-weak" />
                        <span className="flex-1 text-ellipsis">{connector.desktopName ?? connector.name}</span>
                        {isDesktop && (
                            <span
                                className={clsx(
                                    'skill-connector__dot shrink-0',
                                    connector.status === 'connected' && 'is-connected'
                                )}
                                aria-label={
                                    connector.status === 'connected'
                                        ? c('collider_2025:Label').t`Connected`
                                        : c('collider_2025:Label').t`Not connected`
                                }
                            />
                        )}
                    </li>
                ))}
            </ul>
            <Button shape="underline" color="norm" size="small" className="self-start p-0" onClick={onViewAll}>
                {c('collider_2025:Action').t`View all`}
            </Button>
        </section>
    );
};
