import type { VaultColor, VaultIcon } from '../protobuf/vault-v1.static';

export type VaultFormValues = {
    name: string;
    description: string;
    color: VaultColor;
    icon: VaultIcon;
};
