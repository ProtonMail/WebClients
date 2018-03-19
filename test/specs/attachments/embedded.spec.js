import '../../../src/app/attachments/index';
import mailSettingsModelFactory from '../../../src/app/settings/factories/mailSettingsModel';

const EMBEDDED_ATTACHMENTS = [
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
    }
];

const getMessage = ({ body, draft = false, attachments = [] }) => {
    return {
        ID: '123',
        getAttachments() {
            return attachments;
        },
        isDraft() {
            return draft;
        },
        getDecryptedBody() {
            return body;
        }
    };
};

describe('embedded service', () => {

    let embeddedService;
    let mailSettingsModel;

    beforeEach(angular.mock.module('ui.router'));
    angular.module('proton.authentication', []);
    angular.module('proton.utils', [])
        .factory('tools', () => ({
            hash: () => '123-345'
        }));
    angular.module('proton.commons', []);
    window.URL = ({ createObjectURL: () => '123-345' });

    beforeEach(angular.mock.module('proton.authentication'));
    beforeEach(angular.mock.module('proton.attachments'));

    beforeEach(angular.mock.module(($provide) => {
        $provide.service('AttachmentLoader', () => ({
                async get() {
                    return [];
                }
            })
        );
        $provide.service('mailSettingsModel', mailSettingsModelFactory);
    }));

    beforeEach(angular.mock.inject((_embedded_, _mailSettingsModel_) => {
        embeddedService = _embedded_;
        mailSettingsModel = _mailSettingsModel_;
        mailSettingsModel.set('all', {
            ShowImages: 2
        });
    }));

    it('should parse embedded images and set src when they are not escaped with proton-', async () => {
        const message = getMessage({
            body: '<img class="proton-embedded" src="cid:-9e96b583@protonmail.com" alt="embedded.jpg" >',
            attachments: EMBEDDED_ATTACHMENTS
        });
        const body = await embeddedService.parser(message);
        expect(body).toEqual('<img class="proton-embedded" alt="embedded.jpg" src="123-345" data-embedded-img="-9e96b583@protonmail.com">');
    });

    it('should not parse embedded images and set src when they are escaped with proton-', async () => {
        const message = getMessage({
            body: '<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg" >',
            attachments: EMBEDDED_ATTACHMENTS
        });
        const body = await embeddedService.parser(message);
        expect(body).toEqual('<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">');
    });
});
