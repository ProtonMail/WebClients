import type { ItemRevision } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import type { SshKeyData } from '../../native';
import { ssh_agent_napi } from '../../native';
import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'sshAgent:start': IPCChannel<[], string>;
        'sshAgent:stop': IPCChannel<[], string>;
        'sshAgent:sendSshKeyItems': IPCChannel<[ItemRevision<'sshKey'>[]], string>;
        'sshAgent:getStatus': IPCChannel<[], ssh_agent_napi.SshAgentStatus>;
    }
}

const intoNativeSshKey = (item: ItemRevision<'sshKey'>): SshKeyData => ({
    id: item.itemId,
    name: item.data.metadata.name,
    publicKey: item.data.content.publicKey || '',
    privateKey: deobfuscate(item.data.content.privateKey) || '',
});

export const setupIpcHandlers = () => {
    setupIpcHandler('sshAgent:start', async () => ssh_agent_napi.startAgent());
    setupIpcHandler('sshAgent:stop', async () => ssh_agent_napi.stopAgent());
    setupIpcHandler('sshAgent:sendSshKeyItems', async (_, items) => {
        const keys = items.map(intoNativeSshKey);
        return ssh_agent_napi.sendKeys(keys);
    });
    setupIpcHandler('sshAgent:getStatus', async () => ssh_agent_napi.getStatus());
};
