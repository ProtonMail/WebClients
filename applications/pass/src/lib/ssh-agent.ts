import { type SshAgentService, createSshAgentService } from '@proton/pass/lib/ssh-agent/service';
import type { MaybeNull } from '@proton/pass/types';

export const sshAgent: MaybeNull<SshAgentService> = DESKTOP_BUILD
    ? createSshAgentService({ bridge: window.ctxBridge! })
    : null;
