import type { MaybeNull } from '../../types/utils';

export type HeaderProps = {
    onLock: () => void;
    onLogout: (options: { soft: boolean }) => void;
    interactive: boolean;
    origin?: MaybeNull<string>;
};
