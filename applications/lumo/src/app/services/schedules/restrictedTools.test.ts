import type { ClientToolExecutor } from '@proton/lumo-api-client/core/client-tools';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';

import { restrictScheduleTools } from './restrictedTools';

function setup() {
    const manifests: DesktopConnector[] = [
        {
            id: 'calendar',
            display_name: 'Calendar',
            enabled: true,
            status: { state: 'ready' },
            tools: [{ name: 'read' }],
        },
        {
            id: 'calendar__other',
            display_name: 'Other',
            enabled: true,
            status: { state: 'ready' },
            tools: [{ name: 'write' }],
        },
    ];
    const execute = jest.fn<ReturnType<ClientToolExecutor['execute']>, Parameters<ClientToolExecutor['execute']>>(
        async () => [{ content: 'ok' }]
    );
    const base: ClientToolExecutor = {
        getClientTools: async () =>
            manifests.flatMap((item) =>
                (item.tools ?? []).map((tool) => ({
                    type: 'function' as const,
                    function: { name: `${item.id}__${tool.name}`, parameters: { type: 'object', properties: {} } },
                }))
            ),
        canExecute: () => true,
        normalizeCalls: (calls) =>
            calls.map((call) => ({ ...call, name: call.name === 'alias' ? 'calendar__other__write' : call.name })),
        execute,
    };
    const guard = jest.fn();
    return {
        manifests,
        execute,
        guard,
        tools: restrictScheduleTools(base, ['calendar'], async () => manifests, guard),
    };
}
test('advertises only exact tools attached to selected connectors', async () => {
    const h = setup();
    expect((await h.tools.getClientTools!()).map((item) => item.function.name)).toEqual(['calendar__read']);
    expect(h.tools.canExecute('calendar__other__write')).toBe(false);
});
test('prefix overlap and aliases cannot bypass execution restrictions', async () => {
    const h = setup();
    const results = await h.tools.execute([
        { id: '1', name: 'alias', arguments: '{}' },
        { id: '2', name: 'calendar__read', arguments: '{}' },
    ]);
    expect(results[0].is_error).toBe(true);
    expect(h.execute).toHaveBeenCalledTimes(1);
    expect(h.execute.mock.calls[0][0][0].name).toBe('calendar__read');
});
test('revoking a connector after advertisement blocks execution', async () => {
    const h = setup();
    await h.tools.getClientTools!();
    h.manifests[0].enabled = false;
    expect((await h.tools.execute([{ id: '1', name: 'calendar__read', arguments: '{}' }]))[0].is_error).toBe(true);
    expect(h.execute).not.toHaveBeenCalled();
});
test('expired session prevents connector dispatch', async () => {
    const h = setup();
    h.guard.mockImplementation(() => {
        throw new DOMException('expired', 'AbortError');
    });
    await expect(h.tools.execute([{ id: '1', name: 'calendar__read', arguments: '{}' }])).rejects.toMatchObject({
        name: 'AbortError',
    });
    expect(h.execute).not.toHaveBeenCalled();
});

test('an omitted enabled flag uses the manifest default of enabled', async () => {
    const h = setup();
    delete h.manifests[0].enabled;
    expect((await h.tools.getClientTools!()).map((item) => item.function.name)).toEqual(['calendar__read']);
    await h.tools.execute([{ id: '1', name: 'calendar__read', arguments: '{}' }]);
    expect(h.execute).toHaveBeenCalledTimes(1);
});

test('a connector becoming blocked prevents dispatch after advertisement', async () => {
    const h = setup();
    await h.tools.getClientTools!();
    h.manifests[0].readiness = { state: 'blocked', reason: 'Setup required' };
    expect((await h.tools.execute([{ id: '1', name: 'calendar__read', arguments: '{}' }]))[0].is_error).toBe(true);
    expect(h.execute).not.toHaveBeenCalled();
});
