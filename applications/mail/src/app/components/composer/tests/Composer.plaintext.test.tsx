import { fireEvent } from '@testing-library/dom';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { clearAll, createDocument, waitForSpyCall } from '../../../helpers/test/helper';
import { render } from '../../../helpers/test/render';
import Composer from '../Composer';
import { ID, prepareMessage, props, setHTML } from './Composer.test.helpers';
import * as useSaveDraft from '../../../hooks/message/useSaveDraft';

jest.setTimeout(20000);

// In this test, switching from plaintext to html will trigger autosave
// But encryption and save requests are not the point of this test so it's easier and faster to mock that logic
jest.mock('../../../hooks/message/useSaveDraft', () => {
    const saveSpy = jest.fn(() => Promise.resolve());
    return {
        saveSpy,
        useCreateDraft: () => () => Promise.resolve(),
        useSaveDraft: () => saveSpy,
        useDeleteDraft: () => () => Promise.resolve(),
    };
});

const saveSpy = (useSaveDraft as any).saveSpy as jest.Mock;

describe('Composer switch plaintext <-> html', () => {
    afterEach(clearAll);

    it('should switch from plaintext to html content without loosing content', async () => {
        const content = 'content';

        prepareMessage({
            localID: ID,
            data: {
                MIMEType: 'text/plain' as MIME_TYPES,
                ToList: [],
            },
            plainText: content,
        });

        const { findByTestId } = await render(<Composer {...props} messageID={ID} />);

        const moreDropdown = await findByTestId('squire-more');
        fireEvent.click(moreDropdown);

        const toHtmlButton = await findByTestId('squire-to-html');
        fireEvent.click(toHtmlButton);

        await waitForSpyCall(setHTML);

        await findByTestId('squire-iframe');

        expect(setHTML).toHaveBeenCalledWith(`<p>${content}</p>\n`);

        // Wait for auto save
        await waitForSpyCall(saveSpy);
    });

    it('should switch from html to plaintext content without loosing content', async () => {
        const content = `
          <div>content line 1<br><div>
          <div>content line 2<br><div>
        `;

        prepareMessage({
            localID: ID,
            data: {
                MIMEType: 'text/html' as MIME_TYPES,
                ToList: [],
            },
            document: createDocument(content),
        });

        const { findByTestId } = await render(<Composer {...props} messageID={ID} />);

        const moreDropdown = await findByTestId('squire-more');
        fireEvent.click(moreDropdown);

        const toHtmlButton = await findByTestId('squire-to-plaintext');
        fireEvent.click(toHtmlButton);

        const textarea = (await findByTestId('squire-textarea')) as HTMLTextAreaElement;

        expect(textarea.value).toBe('content line 1\n\ncontent line 2');

        // Wait for auto save
        await waitForSpyCall(saveSpy);
    });
});
