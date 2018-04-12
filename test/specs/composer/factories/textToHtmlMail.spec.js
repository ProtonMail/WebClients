import textToHtmlMail from '../../../../src/app/squire/services/textToHtmlMail';

describe('textToHtmlMail', () => {
    const signatureBuilder = {
        getTXT: () => '',
        getHTML: () => ''
    };
    const service = textToHtmlMail(signatureBuilder);

    it('should not remove single backslash', () => {
        const string = 'this is a text with \\ one backslash';
        expect(service.parse(string)).toEqual(`<div>${string}</div>\n`);
    });

    it('should not remove double backslash', () => {
        const string = 'this is a text with \\\\ two backslashes';
        expect(service.parse(string)).toEqual(`<div>${string}</div>\n`);
    });

    it('should not remove triple backslash', () => {
        const string = 'this is a text with \\\\\\ three backslashes';
        expect(service.parse(string)).toEqual(`<div>${string}</div>\n`);
    });
});
