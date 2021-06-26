import { SharedURLFlags } from '../interfaces/sharing';
import { splitGeneratedAndCustomPassword, adjustName, splitLinkName } from './link';

describe('splitGeneratedAndCustomPassword', () => {
    it('no custom password returns only generated password', () => {
        expect(splitGeneratedAndCustomPassword('1234567890ab', { Flags: 0 })).toEqual(['1234567890ab', '']);
    });

    it('legacy custom password returns only custom password', () => {
        expect(splitGeneratedAndCustomPassword('abc', { Flags: SharedURLFlags.CustomPassword })).toEqual(['', 'abc']);
    });

    it('new custom password returns both generated and custom password', () => {
        expect(
            splitGeneratedAndCustomPassword('1234567890ababc', {
                Flags: SharedURLFlags.CustomPassword | SharedURLFlags.GeneratedPasswordIncluded,
            })
        ).toEqual(['1234567890ab', 'abc']);
    });
});

describe('adjustName', () => {
    it('should add index to a file with extension', () => {
        expect(adjustName(3, 'filename', 'ext')).toBe('filename (3).ext');
    });

    it('should add index to a file without extension', () => {
        expect(adjustName(3, 'filename')).toBe('filename (3)');
        expect(adjustName(3, 'filename', '')).toBe('filename (3)');
        expect(adjustName(3, 'filename.')).toBe('filename. (3)');
        expect(adjustName(3, '.filename.')).toBe('.filename. (3)');
    });

    it('should add index to a file without name', () => {
        expect(adjustName(3, '', 'ext')).toBe('.ext (3)');
    });

    it('should leave zero-index filename with extension unchanged', () => {
        expect(adjustName(0, 'filename', 'ext')).toBe('filename.ext');
    });

    it('should leave zero-index filename without extension unchanged', () => {
        expect(adjustName(0, 'filename')).toBe('filename');
        expect(adjustName(0, 'filename', '')).toBe('filename');
        expect(adjustName(0, 'filename.')).toBe('filename.');
        expect(adjustName(0, '.filename.')).toBe('.filename.');
    });

    it('should leave zero-index filename without name unchanged', () => {
        expect(adjustName(0, '', 'ext')).toBe('.ext');
    });
});

describe('splitLinkName', () => {
    it('should split file name and extension', () => {
        expect(splitLinkName('filename.ext')).toEqual(['filename', 'ext']);
    });

    it('should split file name without extension', () => {
        expect(splitLinkName('filename')).toEqual(['filename', '']);
        expect(splitLinkName('filename.')).toEqual(['filename.', '']);
    });

    it('should split file name without name', () => {
        expect(splitLinkName('.ext')).toEqual(['', 'ext']);
    });
});
