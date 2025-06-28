import { cleanProxyImagesFromClipboardContent } from '@proton/mail/helpers/message/cleanProxyImagesFromClipboardContent';
import { PROXY_IMG_URL } from '@proton/shared/lib/api/images';

describe('cleanProxyImagesFromClipboardContent', () => {
    const mockSetData = jest.fn();
    const mockClipboardEvent: ClipboardEvent = {
        clipboardData: {
            setData: mockSetData,
        },
        preventDefault: jest.fn(),
    } as any;
    const mockDragEvent: DragEvent = {
        dataTransfer: {
            setData: mockSetData,
        },
    } as any;

    // Get selection from html content (as string)
    const setup = (content: string) => {
        const container = document.createElement('div');
        container.innerHTML = content;
        document.body.appendChild(container);

        const range = document.createRange();
        range.selectNodeContents(container);

        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }

        return selection!;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should replace images proxy urls with original urls from copied content [copy event]', () => {
        const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://mail.proton.me/api/${PROXY_IMG_URL}?Url=https://image.com/image.png&DryRun=1">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;
        const selection = setup(content);
        cleanProxyImagesFromClipboardContent('copy', mockClipboardEvent, selection);

        const expectedHTMLSelection = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://image.com/image.png">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;

        const expectedPlainSelection = `Text before images\n\nText in the middle\n\nText after images`;

        expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
        expect(mockSetData.mock.calls[0][1]).toEqual(expectedHTMLSelection);

        expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
        expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
    });

    it('should do nothing if no range is found [copy event]', () => {
        cleanProxyImagesFromClipboardContent('copy', mockClipboardEvent, null);

        expect(mockSetData).not.toHaveBeenCalled();
    });

    it('should keep content properly formatted [copy event]', () => {
        const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>First paragraph</p>
<p>Second paragraph</p>
<a href="https://example.com">Link below</a>
</div>`;
        const selection = setup(content);
        cleanProxyImagesFromClipboardContent('copy', mockClipboardEvent, selection);

        // A bit strange, but turndown is inserting a space between the line breaks
        const expectedPlainSelection = `First paragraph\n\nSecond paragraph\n\nLink below`;

        expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
        expect(mockSetData.mock.calls[0][1]).toEqual(content);

        expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
        expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
    });

    it('should replace images proxy urls with original urls from copied content [drag event]', () => {
        const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://mail.proton.me/api/${PROXY_IMG_URL}?Url=https://image.com/image.png&DryRun=1">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;
        const selection = setup(content);
        cleanProxyImagesFromClipboardContent('drag', mockDragEvent, selection);

        const expectedHTMLSelection = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>Text before images</p>
<img src="https://image.com/image.png">
<p>Text in the middle</p>
<img src="https://image.com/image.png">
<p>Text after images</p>
</div>`;

        const expectedPlainSelection = `Text before images\n\nText in the middle\n\nText after images`;

        expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
        expect(mockSetData.mock.calls[0][1]).toEqual(expectedHTMLSelection);

        expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
        expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
    });

    it('should replace images proxy url with original url from single image copy [drag event]', () => {
        const imgAlt = 'image alt text';
        const img = document.createElement('img');
        img.src = `https://mail.proton.me/api/${PROXY_IMG_URL}?Url=https://image.com/image.png&DryRun=1`;
        img.alt = imgAlt;
        const mockDragEvent: DragEvent = {
            target: img,
            dataTransfer: {
                setData: mockSetData,
            },
        } as any;
        const selection = { rangeCount: 0 } as Selection;
        cleanProxyImagesFromClipboardContent('drag', mockDragEvent, selection);

        const expectedHTMLSelection = `<img src="https://image.com/image.png" alt="${imgAlt}">`;

        expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
        expect(mockSetData.mock.calls[0][1]).toEqual(expectedHTMLSelection);

        expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
        expect(mockSetData.mock.calls[1][1]).toEqual('');
    });

    it('should do nothing if no range is found [drag event]', () => {
        cleanProxyImagesFromClipboardContent('drag', mockDragEvent, null);

        expect(mockSetData).not.toHaveBeenCalled();
    });

    it('should keep content properly formatted [drag event]', () => {
        const content = `<div xmlns="http://www.w3.org/1999/xhtml">
<p>First paragraph</p>
<p>Second paragraph</p>
<a href="https://example.com">Link below</a>
</div>`;
        const selection = setup(content);
        cleanProxyImagesFromClipboardContent('drag', mockDragEvent, selection);

        // A bit strange, but turndown is inserting a space between the line breaks
        const expectedPlainSelection = `First paragraph\n\nSecond paragraph\n\nLink below`;

        expect(mockSetData.mock.calls[0][0]).toEqual('text/html');
        expect(mockSetData.mock.calls[0][1]).toEqual(content);

        expect(mockSetData.mock.calls[1][0]).toEqual('text/plain');
        expect(mockSetData.mock.calls[1][1]).toEqual(expectedPlainSelection);
    });
});
