import { decrementUnread, incrementUnread } from './mailboxHelpers';

describe('decrementUnread', () => {
    it('should return 0 if parameters are undefined', () => {
        expect(decrementUnread()).toBe(0);
    });

    it('should decrement by 1 by default', () => {
        expect(decrementUnread(1)).toBe(0);
    });

    it('should return 0 if currentUnread is 0', () => {
        expect(decrementUnread(0, 1)).toBe(0);
    });

    it('should decrement correctly', () => {
        expect(decrementUnread(5, 2)).toBe(3);
    });

    it('should not go below 0', () => {
        expect(decrementUnread(1, 2)).toBe(0);
    });
});

describe('incrementUnread', () => {
    it('should return 1 if parameters are undefined', () => {
        expect(incrementUnread()).toBe(1);
    });

    it('should increment by 1 by default', () => {
        expect(incrementUnread(1)).toBe(2);
    });

    it('should increment from 0', () => {
        expect(incrementUnread(0, 1)).toBe(1);
    });

    it('should increment correctly', () => {
        expect(incrementUnread(5, 2)).toBe(7);
    });
});
