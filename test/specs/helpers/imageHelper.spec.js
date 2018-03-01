import { resizeImage, toFile } from '../../../src/helpers/imageHelper';
import img from '../../media/img';

const MIMETYPE_REGEX = /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/;
const fileName = 'proton';


describe('toFile', () => {
    it('it should be an instance of an Object', () => {
        expect(toFile(img, fileName) instanceof Object).toBeTruthy();
    });

    it('it should be an instance of a File', () => {
        expect(toFile(img, fileName) instanceof File).toBeTruthy();
    });

    it('it should have the correct name', () => {
        expect(toFile(img, fileName).name).toBe(fileName);
    });
});

describe('resizeImage', () => {
    it('it should be a string', async () => {
        const base64str = await resizeImage(img, 100);

        expect(typeof base64str).toBe('string');
    });

    it('it should be shorter than the original', async () => {
        const base64str = await resizeImage(img, 100);

        expect(base64str.length).toBeLessThan(img.length);
    });

    it('it should be a 64 string encoded', async () => {
        const base64str = await resizeImage(img, 100);

        expect(typeof window.atob(base64str.replace('data:image/jpeg;base64,', ''))).toBe('string');
    });

    it('it should be respect the MIMEType set', async () => {
        const base64str = await resizeImage(img, 100, 'image/png');

        expect(base64str.match(MIMETYPE_REGEX)[1]).toBe('image/png');
    });

    it('it should have a difference on image quality', async () => {
        const [base64str1, base64str2] = await Promise.all([ resizeImage(img, 100, 'image/jpeg', 1), resizeImage(img, 100, 'image/jpeg', 0.1) ]);

        expect(base64str1.length).toBeGreaterThan(base64str2.length);
    });

    it('it should be lighter than the original', async () => {
        const base64str = await resizeImage(img, 100);
        const resizedFile = toFile(base64str, 'file1');
        const originalFile = toFile(img, 'file2');

        expect(resizedFile.size).toBeLessThan(originalFile.size);
    });
});
