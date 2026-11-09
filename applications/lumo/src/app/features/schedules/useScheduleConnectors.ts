import { getDesktopConnectorCatalog, useDesktopManifests } from '@proton/lumo-api-client/core/desktop-tools';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';

/** Includes setup candidates; registry state remains authoritative for usability. */
export function useScheduleConnectors() {
    const { manifests, status } = useDesktopManifests();
    const catalog = status === 'ready' ? getDesktopConnectorCatalog().connectors : [];
    const icons = new Map(catalog.map(({ id, icon }) => [id, icon?.startsWith('data:image/') ? icon : undefined]));
    const registered = new Set(manifests.map(({ id }) => id));
    const presets: DesktopConnector[] =
        status === 'ready'
            ? catalog
                  .filter(({ id }) => !registered.has(id))
                  .map(({ id, name, description }) => ({
                      id,
                      display_name: name,
                      description,
                      icon: icons.get(id),
                      enabled: false,
                      readiness: { state: 'blocked', reason: 'Connector is not registered' },
                      status: { state: 'not_ready', reason: 'Not connected yet' },
                  }))
            : [];
    return {
        connectors: [
            ...manifests.map((manifest) => ({ ...manifest, icon: manifest.icon ?? icons.get(manifest.id) })),
            ...presets,
        ],
        status,
    };
}
