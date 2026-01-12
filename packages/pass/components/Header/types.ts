import type { MaybeNull } from '@proton/pass/types';

export type HeaderProps = {
    onLock: () => void;
    onLogout: (options: { soft: boolean }) => void;
    interactive: boolean;
    origin?: MaybeNull<string>;
};
