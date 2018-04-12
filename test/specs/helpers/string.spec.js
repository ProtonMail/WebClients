import { removeEmailAlias, generateUID } from '../../../src/helpers/string';

const EMAILS = {
    'dew@foo.bar': 'dew@foo.bar',
    'dew.new@foo.bar': 'dewnew@foo.bar',
    'dew+polo@foo.bar': 'dew@foo.bar',
    'dew.new+polo@foo.bar': 'dewnew@foo.bar',
    'dew.NEW+polo@foo.bar': 'dewnew@foo.bar'
};

describe('removeEmailAlias', () => {

    it('should remove the alias but keep the email', () => {
        Object.keys(EMAILS).forEach((email) => {
            expect(removeEmailAlias(email)).toBe(EMAILS[email]);
        })
    });
});

describe('generateUID', () => {

    const list = Array.from({ length: 1337 }, () => generateUID());

    it('should create 1337 UID', () => {
        const map = list
            .reduce((acc, key) => (acc[key] = 1, acc), Object.create(null));
        expect(Object.keys(map).length).toBe(1337);
    });
});
