import { removeLocalPath } from './routing';

describe('routing utils', () => {
    test('removeLocalPath', () => {
        expect(removeLocalPath('/u/123/path')).toBe('path');
        expect(removeLocalPath('/u/123/path/sub-path/')).toBe('path/sub-path/');
        expect(removeLocalPath('/u/123/')).toBe('');
        expect(removeLocalPath('/u/123')).toBe('');
        expect(removeLocalPath('/some/other/path')).toBe('/some/other/path');
        expect(removeLocalPath('/some/other/path/')).toBe('/some/other/path/');
        expect(removeLocalPath('/u/localID/')).toBe('/u/localID/');
        expect(removeLocalPath('/u/')).toBe('/u/');
    });
});
