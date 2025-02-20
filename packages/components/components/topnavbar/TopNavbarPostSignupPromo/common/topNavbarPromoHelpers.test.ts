import { isRootFolder } from './topNavbarPromoHelpers';

const pathToTest = [
    [{ path: '/inbox', expected: true }],
    [{ path: '/draft', expected: true }],
    [
        {
            path: '/inbox/conversation',
            expected: false,
        },
    ],
];

describe('Top navbar offers helpers', () => {
    it.each(pathToTest)('Test the folder to see if root %s', (obj) => {
        expect(isRootFolder(obj.path)).toBe(obj.expected);
    });
});
