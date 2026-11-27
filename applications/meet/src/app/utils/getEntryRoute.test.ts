import { getEntryRoute } from './getEntryRoute';

describe('getEntryRoute', () => {
    it.each([
        ['/join/id-abc123', 'join'],
        ['/guest/join/id-abc123', 'join'],
        ['/u/0/join/id-abc123', 'join'],
        ['/manage-recordings', 'manage-recordings'],
        ['/start-free-meeting', 'start-free-meeting'],
        ['/dashboard', 'dashboard'],
        ['/', 'dashboard'],
    ])('maps %s to %s', (pathname, entryRoute) => {
        expect(getEntryRoute(pathname)).toBe(entryRoute);
    });
});
