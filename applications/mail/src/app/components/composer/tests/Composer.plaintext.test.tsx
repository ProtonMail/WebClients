import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Recipient } from 'proton-shared/lib/interfaces';
import { messageCache } from '../../../helpers/test/cache';
import { clearAll, createDocument, waitForSpyCall } from '../../../helpers/test/helper';
import { render } from '../../../helpers/test/render';
import { MessageExtended } from '../../../models/message';
import Composer from '../Composer';
import { ID, props, setHTML } from './Composer.test.helpers';

jest.setTimeout(20000);

describe('Composer switch plaintext <-> html', () => {
    afterEach(clearAll);

    it('should switch from plaintext to html content without loosing content', async () => {
        const content = 'content';

        const message = {
            localID: ID,
            initialized: true,
            data: {
                ID,
                MIMEType: 'text/plain' as MIME_TYPES,
                Subject: '',
                ToList: [] as Recipient[],
            },
            plainText: content,
        } as MessageExtended;
        messageCache.set(ID, message);

        const { findByTestId } = await render(<Composer {...props} messageID={ID} />);

        const moreDropdown = await findByTestId('squire-more');
        fireEvent.click(moreDropdown);

        const toHtmlButton = await findByTestId('squire-to-html');
        fireEvent.click(toHtmlButton);

        await waitForSpyCall(setHTML);

        await findByTestId('squire-iframe');

        expect(setHTML).toHaveBeenCalledWith(`<p>${content}</p>\n`);
    });

    it('should switch from html to plaintext content without loosing content', async () => {
        const content = `
          <div>content line 1<br><div>
          <div>content line 2<br><div>
        `;

        const message = {
            localID: ID,
            initialized: true,
            data: {
                ID,
                MIMEType: 'text/html' as MIME_TYPES,
                Subject: '',
                ToList: [] as Recipient[],
            },
            document: createDocument(content),
        } as MessageExtended;
        messageCache.set(ID, message);

        const { findByTestId } = await render(<Composer {...props} messageID={ID} />);

        const moreDropdown = await findByTestId('squire-more');
        fireEvent.click(moreDropdown);

        const toHtmlButton = await findByTestId('squire-to-plaintext');
        fireEvent.click(toHtmlButton);

        const textarea = (await findByTestId('squire-textarea')) as HTMLTextAreaElement;

        expect(textarea.value).toBe('content line 1\n\ncontent line 2');
    });
});
