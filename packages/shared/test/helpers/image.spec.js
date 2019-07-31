import { resizeImage, toBlob, toFile, formatImage } from '../../lib/helpers/image';
import img from './file.data'; // width: 300 px, height: 200 px

const MIMETYPE_REGEX = /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/;
const fileName = 'proton';

describe('toBlob', () => {
    it('it should be an instance of an Object', () => {
        expect(toBlob(img) instanceof Object).toBeTruthy();
    });

    it('it should be an instance of a Blob', () => {
        expect(toBlob(img) instanceof Blob).toBeTruthy();
    });
});

describe('toFile', () => {
    it('it should be an instance of an Object', () => {
        expect(toFile(img) instanceof Object).toBeTruthy();
    });

    it('it should be an instance of a File', () => {
        expect(toFile(img) instanceof File).toBeTruthy();
    });

    it('it should have the correct name', () => {
        expect(toFile(img, fileName).name).toBe(fileName);
    });
});

describe('resizeImage', () => {
    it('it should be a string', async () => {
        const base64str = await resizeImage(img, 100, 100);

        expect(typeof base64str).toBe('string');
    });

    it('it should be shorter than the original if resized', async () => {
        const base64str = await resizeImage(img, 100, 100);

        expect(base64str.length).toBeLessThan(img.length);
    });

    it('it should not be resized if the resize parameters coincide with the original image size', async () => {
        const base64str = await resizeImage(img, 300, 200);

        expect(base64str.length).toBe(img.length);
    });

    it('it should not be resized if the width resize parameters is bigger than the original and the height is ignored', async () => {
        const base64str = await resizeImage(img, 900);

        expect(base64str.length).toBe(img.length);
    });

    it('it should not be resized if the height resize parameters is bigger than the original and the width is ignored', async () => {
        const base64str = await resizeImage(img, 0, 400);

        expect(base64str.length).toBe(img.length);
    });

    it('it should be a 64 string encoded', async () => {
        const base64str = await resizeImage(img, 100, 100);

        expect(typeof window.atob(base64str.replace('data:image/jpeg;base64,', ''))).toBe('string');
    });

    it('it should be respect the MIMEType set', async () => {
        const base64str = await resizeImage(img, 100, 0, 'image/png');

        expect(base64str.match(MIMETYPE_REGEX)[1]).toBe('image/png');
    });

    it('it should have a difference on image quality', async () => {
        const [base64str1, base64str2] = await Promise.all([
            resizeImage(img, 100, 0, 'image/jpeg', 1),
            resizeImage(img, 100, 0, 'image/jpeg', 0.1)
        ]);

        expect(base64str1.length).toBeGreaterThan(base64str2.length);
    });

    it('it should be lighter than the original', async () => {
        const base64str = await resizeImage(img, 100);
        const resizedFile = toFile(base64str, 'file1');
        const originalFile = toFile(img, 'file2');

        expect(resizedFile.size).toBeLessThan(originalFile.size);
    });
});

describe('formatImage', () => {
    [
        {
            output: '',
            name: 'return an empty string if no input'
        },
        {
            input: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            output: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            name: 'return the input if it is a well-formed base64'
        },
        {
            input: 'https://i.imgur.com/WScAnHr.jpg',
            output: 'https://i.imgur.com/WScAnHr.jpg',
            name: 'return the URL if it is an URL'
        },
        {
            input:
                '/9j/4AAQSkZJRgABAQAAkACQAAD/4QB0RXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAACQAAAAAQAAAJAA',
            output:
                'data:image/png;base64,/9j/4AAQSkZJRgABAQAAkACQAAD/4QB0RXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAACQAAAAAQAAAJAA',
            name: 'return a base64 if the input is not an URL nor a base64'
        }
    ].forEach(({ name, input, output }) => {
        it(`should ${name}`, () => {
            expect(formatImage(input)).toBe(output);
        });
    });
});
