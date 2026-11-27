import type { EntryRoute } from '@proton/meet/telemetry/events';

export const getEntryRoute = (pathname: string): EntryRoute => {
    const path = pathname.replace(/^\/guest/, '').replace(/^\/u\/\d+/, '');

    if (path.startsWith('/join')) {
        return 'join';
    }
    if (path.startsWith('/manage-recordings')) {
        return 'manage-recordings';
    }
    if (path.startsWith('/start-free-meeting')) {
        return 'start-free-meeting';
    }
    return 'dashboard';
};
