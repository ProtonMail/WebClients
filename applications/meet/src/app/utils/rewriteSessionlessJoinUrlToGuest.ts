import { getMaybeHasSessions } from './getMaybeHasSessions';

export const rewriteSessionlessJoinUrlToGuest = () => {
    const { pathname, search, hash } = window.location;

    if (!pathname.startsWith('/join') || getMaybeHasSessions()) {
        return;
    }

    window.history.replaceState(window.history.state, '', `/guest${pathname}${search}${hash}`);
};
