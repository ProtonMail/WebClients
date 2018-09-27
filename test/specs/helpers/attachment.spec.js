import { blobEqualsAttachment } from '../../../src/helpers/attachment';

const SERVER_ATTACHMENTS = [
    {
        ID: 'PFPSudynUFJno7La1JfEiWjJhbXbr8Q0jVkhpr2gsmzddl1INjEP0LTeh5LKmQ2cJCdP9mkr-pFTerVm5HZBuQ==',
        Name: 'embedded.jpg',
        Size: 398797,
        MIMEType: 'image/jpeg',
        KeyPackets: 'wcBMAzVBUDPeoTe/AQf/fEqHeWxYDJpNc3pJKRIj30iV0GNmR2jENzK9WUxluiyv8kuDJEVJbfALIfDBo9mQB9czbDIWbPZCIhphbVXAix8fo7ufN87293NkTbqlmCahs7V1prBduYNHWEAmSv0dLrP3WZNsUHJcs7WY274ZtdVcNKp724L+FRy6Tlq5yhLI93uDNhXVCOUBO/qIHg/1zOqxzlfQieAih10kyF3xjy3XR+cVPfp2A3URqEv7Oa52VMK4anQBViO8Ag4hFojUCpIVOz/zEnJU5/CGJWoPSNCfYOpqrkqHshfi9209sp2TvF2aeF5pspyypra9wRYtO2LSkZ0cxP6tzABLQknsgg==',
        Headers: {
            'content-disposition': 'inline',
            'content-id': '<-9e96b583@protonmail.com>',
            embedded: 1
        },
        Signature: null
    },
    {
        Name: 'publickey - kaykeytest3@protonmail.com - 0xE1DADAE3.asc',
        MIMEType: 'application/pgp-keys',
        Size: 1889
    },
    {
        Name: 'publickey - kaykeytest3@protonmail.com - 0xE1DADAE3.asc',
        MIMEType: 'application/pgp-keys',
        Size: 1000
    }
];

const BLOBS = [
    {
        name: 'embedded.jpg',
        type: 'image/jpeg',
        size: 398000
    },
    {
        name: 'publickey - kaykeytest3@protonmail.com - 0xE1DADAE3.asc',
        type: 'application/pgp-keys',
        size: 1781
    },
    {
        name: 'publickey - kaykeytest3@protonmail.com - 0xE1DADAE3.asc',
        type: 'application/pgp-keys',
        size: 1199
    }
];

describe('attachment', () => {

    it('should match similar attachments', async () => {
        SERVER_ATTACHMENTS.forEach((attachment, index) => {
            expect(blobEqualsAttachment(BLOBS[index], attachment)).toBe(true);
        });
    });


    it('should not match different attachments', async () => {
        SERVER_ATTACHMENTS.forEach((attachment, index) => {
            const someMatch = BLOBS.some((blob, blobIndex) => {
                    if (index === blobIndex) {
                        return false;
                    }
                    return blobEqualsAttachment(blob, attachment);
                });
            expect(someMatch).toBe(false);
            }
        );
    });
});
