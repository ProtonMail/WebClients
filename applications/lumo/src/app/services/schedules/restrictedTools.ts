import type { ClientToolExecutor } from '@proton/lumo-api-client/core/client-tools';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';

/** Restrict advertisement and execution using exact manifest identities, including after alias normalization. */
export function restrictScheduleTools(
    base: ClientToolExecutor,
    connectorIds: string[],
    getConnectors: () => Promise<DesktopConnector[]>,
    guard: () => void
): ClientToolExecutor {
    const connectors = new Set(connectorIds);
    let allowed = new Set<string>();
    const reload = async () => {
        guard();
        const manifests = await getConnectors();
        guard();
        allowed = new Set(
            manifests
                .filter(
                    (item) => item.enabled !== false && item.readiness?.state !== 'blocked' && connectors.has(item.id)
                )
                .flatMap((item) => (item.tools ?? []).map((tool) => `${item.id}__${tool.name}`))
        );
    };
    return {
        async getClientTools() {
            await reload();
            const tools = (await base.getClientTools?.()) ?? [];
            guard();
            return tools.filter((tool) => allowed.has(tool.function.name));
        },
        canExecute: (name) => allowed.has(name) && base.canExecute(name),
        normalizeCalls: (calls) => base.normalizeCalls?.(calls) ?? calls,
        async execute(calls) {
            await reload();
            const normalized = base.normalizeCalls?.(calls) ?? calls;
            const results = [];
            for (const call of normalized) {
                guard();
                if (!allowed.has(call.name) || !base.canExecute(call.name)) {
                    results.push({
                        content: JSON.stringify({ error: 'Tool is not attached to this scheduled task' }),
                        is_error: true,
                    });
                    continue;
                }
                const [result] = await base.execute([call]);
                guard();
                results.push(
                    result ?? { content: JSON.stringify({ error: 'Tool returned no result' }), is_error: true }
                );
            }
            return results;
        },
    };
}
