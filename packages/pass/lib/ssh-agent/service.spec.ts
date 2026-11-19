import type { Mocked } from 'vitest';

import type { SSHKeyItem } from '../../types/data/items';
import type { ContextBridgeApi } from '../../types/desktop';
import type { Maybe } from '../../types/utils';
import { createSshAgentService } from './service';

type SshAgentBridge = ContextBridgeApi['sshAgent'];

const createBridge = (): Mocked<SshAgentBridge> => {
    let socketPath: Maybe<string> = undefined;

    return {
        clear: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(async () => {
            socketPath = undefined;
        }),
        getEnabled: vi.fn().mockResolvedValue(false),
        getStatus: vi.fn(async () => ({ socketPath })),
        setEnabled: vi.fn().mockResolvedValue(undefined),
        setKeys: vi.fn().mockResolvedValue(undefined),
        start: vi.fn(async () => {
            socketPath = 'pass-ssh-agent.sock';
        }),
    };
};

const createKey = (shareId: string, itemId: string, revision: number): SSHKeyItem =>
    ({ shareId, itemId, revision }) as SSHKeyItem;

const setup = (items: SSHKeyItem[] = []) => {
    const sshAgent = createBridge();
    const datasource = vi.fn(() => items);
    const service = createSshAgentService({ bridge: { sshAgent } as unknown as ContextBridgeApi, datasource });
    return { sshAgent, datasource, service };
};

describe('createSshAgentService', () => {
    test('does not sync while disabled', async () => {
        const { sshAgent, service } = setup([createKey('s1', 'i1', 1)]);
        await service.sync();
        expect(sshAgent.setKeys).not.toHaveBeenCalled();
    });

    test('calls an empty setKeys on the first sync even when nothing is tracked', async () => {
        const { sshAgent, service } = setup([]);
        await service.start();
        await service.sync();
        expect(sshAgent.setKeys).toHaveBeenCalledTimes(1);
        expect(sshAgent.setKeys).toHaveBeenCalledWith([]);
    });

    test('skips redundant syncs if ssh keys did not change', async () => {
        const { sshAgent, service } = setup([createKey('s1', 'i1', 1)]);
        await service.start();
        await service.sync();
        await service.sync();
        expect(sshAgent.setKeys).toHaveBeenCalledTimes(1);
    });

    test('syncs when ssh keys change', async () => {
        const items = [createKey('s1', 'i1', 1)];
        const { sshAgent, datasource, service } = setup(items);
        await service.start();
        await service.sync();

        datasource.mockReturnValue([createKey('s1', 'i1', 2)]);
        await service.sync();

        expect(sshAgent.setKeys).toHaveBeenCalledTimes(2);
    });

    test('destroy() disables the agent', async () => {
        const { sshAgent, service } = setup([]);
        await service.start();
        await service.sync();
        expect(sshAgent.setKeys).toHaveBeenCalledTimes(1);

        await service.destroy();
        expect(sshAgent.destroy).toHaveBeenCalledTimes(1);
        expect(sshAgent.setEnabled).toHaveBeenCalledWith(false);
        expect(service.enabled).toBe(false);
    });
});
