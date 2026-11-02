import { createDesktopClientToolExecutor, supportsDesktopScheduleReadOnly } from './desktop-tools';
import type { DesktopExternalTools, ScheduleExecutionInput } from './desktop-tools';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
let bridge: DesktopExternalTools;

beforeEach(() => {
    bridge = {
        registerScheduleExecutionContext: jest.fn(async () => ({ connectionId: 'connection', runId: 'run' })),
        getTools: () => [],
        executeToolCalls: jest.fn(async () => []),
    };
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { __TAURI__: { external_tools: bridge }, addEventListener: jest.fn() },
    });
});
afterAll(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
});

const permissions: ScheduleExecutionInput = {
    runId: 'run',
    connectorIds: ['mail'],
    autoApprove: true,
    readOnlyConnectorIds: ['mail'],
};

test('read-only schedules require explicit capability support before registering or invoking tools', async () => {
    expect(supportsDesktopScheduleReadOnly()).toBe(false);
    const executor = createDesktopClientToolExecutor(permissions);
    await expect(executor.getClientTools!()).rejects.toThrow('Update Lumo Desktop');
    await expect(executor.execute([{ id: 'call', name: 'mail__send', arguments: '{}' }])).rejects.toThrow(
        'Update Lumo Desktop'
    );
    expect(bridge.registerScheduleExecutionContext).not.toHaveBeenCalled();
    expect(bridge.executeToolCalls).not.toHaveBeenCalled();
});

test('supported desktops receive an immutable snapshot of both connector lists', async () => {
    bridge.scheduleExecutionCapabilities = { readOnlyConnectors: true };
    expect(supportsDesktopScheduleReadOnly()).toBe(true);
    const input = { ...permissions, connectorIds: ['mail'], readOnlyConnectorIds: ['mail'] };
    const executor = createDesktopClientToolExecutor(input);
    input.connectorIds.push('shell');
    input.readOnlyConnectorIds.length = 0;
    await executor.getClientTools!();
    expect(bridge.registerScheduleExecutionContext).toHaveBeenCalledWith(permissions);
});

test.each([undefined, []])(
    'legacy schedules with readOnlyConnectorIds=%s still run on older desktops',
    async (readOnlyConnectorIds) => {
        await createDesktopClientToolExecutor({ ...permissions, readOnlyConnectorIds }).getClientTools!();
        expect(bridge.registerScheduleExecutionContext).toHaveBeenCalledTimes(1);
    }
);
