import { markDefault } from '../../../src/helpers/addresses';

describe('markDefault', () => {
    const VALID_ADDRESSES = [
        { Order: 4, Send: 1, Receive: 1, Status: 1 },
        { Order: 3, Send: 1, Receive: 1, Status: 1 },
        { Order: 2, Send: 1, Receive: 1, Status: 1 },
        { Order: 1, Send: 0, Receive: 1, Status: 1 }
    ];
    const INVALID_ADDRESSES = [
        { Order: 3, Send: 0, Receive: 1, Status: 1 },
        { Order: 2, Send: 1, Receive: 0, Status: 1 },
        { Order: 1, Send: 1, Receive: 1, Status: 0 }
    ];

    it('should return an array', () => {
        expect(Array.isArray(markDefault())).toBe(true);
    });

    it('should keep the same Array size', () => {
        const result = markDefault(INVALID_ADDRESSES);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(INVALID_ADDRESSES.length);
    });

    it('should order addresses and mark the second address as default', () => {
        const [first, second, third] = markDefault(VALID_ADDRESSES);

        expect(first.isDefault).toBe(false);
        expect(second.isDefault).toBe(true);
        expect(third.Order).toBe(3);
    });

    it("should return the list ordered even if it doesn't find an address", () => {
        const [first, second, third] = markDefault(INVALID_ADDRESSES);

        expect(first.Order).toBe(1);
        expect(second.Order).toBe(2);
        expect(third.Order).toBe(3);

        [first, second, third].forEach((address) => {
            expect(address.isDefault).toBe(false);
        });
    });
});
