import generateUID from './generateUID';

describe('generateUID', () => {
    it('should generate unique IDs with a prefix', () => {
        const prefix = 'test';
        const id1 = generateUID(prefix);
        const id2 = generateUID(prefix);

        expect(id1).toMatch(new RegExp(`^${prefix}-\\d+$`));
        expect(id2).toMatch(new RegExp(`^${prefix}-\\d+$`));
        expect(id1).not.toBe(id2);
    });

    it('should generate unique IDs without a prefix', () => {
        const id1 = generateUID();
        const id2 = generateUID();

        expect(id1).toMatch(/^id-\d+$/);
        expect(id2).toMatch(/^id-\d+$/);
        expect(id1).not.toBe(id2);
    });
});
