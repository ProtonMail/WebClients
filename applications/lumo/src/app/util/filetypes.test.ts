import { getAcceptAttributeString } from './filetypes';

describe('getAcceptAttributeString', () => {
    const accepted = () => getAcceptAttributeString().split(',');

    // iOS derives the picker's sources from `accept`: with no image types in the list it offers
    // only "Choose File", never "Photo Library" or "Take Photo". Keep images in (LUMO-615).
    it('includes image MIME types so iOS offers Photo Library and Camera', () => {
        expect(accepted()).toEqual(
            expect.arrayContaining(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'])
        );
    });

    it('includes non-image MIME types', () => {
        expect(accepted()).toEqual(expect.arrayContaining(['application/pdf', 'text/plain']));
    });

    it('lists extensions dot-prefixed', () => {
        expect(accepted()).toEqual(expect.arrayContaining(['.jpg', '.heic', '.pdf', '.txt']));
    });
});
