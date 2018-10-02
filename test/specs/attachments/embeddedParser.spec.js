import embeddedParserService from '../../../src/app/attachments/services/embeddedParser';
import embeddedUtilsService from '../../../src/app/attachments/services/embeddedUtils';
import { generateModuleName } from '../../utils/helpers';

describe('embedded parser service', () => {
    const MODULE = generateModuleName();

    let embeddedParser;
    let embeddedUtils;
    const messageMock = {};

    const cidMock = { get: () => ({ '-9e96b583@protonmail.com': {} }) };
    const embeddedStoreMock = {
        cid: cidMock,
        getBlob() {
            return { url: '123-234' };
        }
    };

    angular.module(MODULE, []);

    beforeEach(angular.mock.inject(() => {
        embeddedUtils = embeddedUtilsService();
        embeddedParser = embeddedParserService(
            embeddedStoreMock,
            {},
            embeddedUtils,
            {}, {}, {}, {}
        );
    }));

    const getElement = (str) => {
        const div = document.createElement('DIV');
        div.innerHTML = str;
        return div;
    };

    it('should parse embedded images and set src', async () => {
        const div = getElement('<img class="proton-embedded" data-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">');
        await embeddedParser.mutateHTML(messageMock, 'blob', div);
        expect(div.innerHTML)
            .toEqual('<img class="proton-embedded" alt="embedded.jpg" data-src="123-234" data-embedded-img="-9e96b583@protonmail.com">');
    });

    it('should not parse embedded images and set src on proton-src', async () => {
        const div = getElement('<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg" >');
        await embeddedParser.mutateHTML(messageMock, 'blob', div);
        expect(div.innerHTML)
            .toEqual('<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">');
    });

    it('should always transform proton-src to src on direction cid', async () => {
        const div = getElement('<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">');
        await embeddedParser.mutateHTML(messageMock, 'cid', div);
        expect(div.innerHTML)
            .toEqual('<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg" data-src="cid:-9e96b583@protonmail.com">');
    });

    it('should remove data-src when they are escaped with proton', async () => {
        const div = getElement('<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" data-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">');
        await embeddedParser.mutateHTML(messageMock, 'blob', div);
        expect(div.innerHTML)
            .toEqual('<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">');
    });
});
