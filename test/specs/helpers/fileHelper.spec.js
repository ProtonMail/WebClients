import { toFile } from '../../../src/helpers/imageHelper';
import { toBase64 } from '../../../src/helpers/fileHelper';
import img from '../../media/img';

describe('toBase64', async () => {
    const type = 'image/png';
    const filename = 'image';
    let file;

    beforeAll(async () => {
        file = await toFile(img, filename);
    });

    it('it should be a string', async () => {
        const base64str = await toBase64(file);

        expect(typeof base64str).toBe('string');
    });

    it('it should be a 64 string encoded', async () => {
        const base64str = await toBase64(file);

        expect(typeof window.atob(base64str.replace('data:image/png;base64,', ''))).toBe('string');
    });

    it('it should be equals to the original', async () => {
        const str1 = await toBase64(file);
        const f = await toFile(str1, filename);
        const str2 = await toBase64(f);

        expect(str1).toBe(str2);
    });

    it('it should keep the type', async () => {
        const base64str = await toBase64(file);
        const f = await toFile(base64str);

        expect(f.type).toBe(type);
    });
});
