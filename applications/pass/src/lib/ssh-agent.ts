import { registerSshAgentListeners } from 'proton-pass-web/app/Store/ssh-agent.middleware';
import { store } from 'proton-pass-web/app/Store/store';

import { type SshAgentService, createSshAgentService } from '@proton/pass/lib/ssh-agent/service';
import { selectVisibleNonTrashedSshKeyItems } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';

export const sshAgent: MaybeNull<SshAgentService> = DESKTOP_BUILD
    ? createSshAgentService({
          bridge: window.ctxBridge!,
          datasource: () => selectVisibleNonTrashedSshKeyItems(store.getState()),
      })
    : null;

if (sshAgent) registerSshAgentListeners(sshAgent);
