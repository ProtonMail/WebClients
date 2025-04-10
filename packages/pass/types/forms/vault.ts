import type { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1.static';

export type VaultFormValues = {
    name: string;
    description: string;
    color: VaultColor;
    icon: VaultIcon;
};
