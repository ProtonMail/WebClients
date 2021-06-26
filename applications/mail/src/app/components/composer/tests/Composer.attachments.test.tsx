import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Recipient } from 'proton-shared/lib/interfaces';
import { clearAll, messageCache, render, tick } from '../../../helpers/test/helper';
import { MessageExtended } from '../../../models/message';
import Composer from '../Composer';
import { ID, props } from './Composer.test.helpers';

jest.setTimeout(20000);

// Prevent the actual encrypt and upload attachment
jest.mock('../../../helpers/attachment/attachmentUploader', () => {
    return {
        ATTACHMENT_ACTION: {
            ATTACHMENT: 'attachment',
            INLINE: 'inline',
        },
        upload: () => [
            {
                resultPromise: new Promise(() => {
                    // empty
                }),
                addProgressListener: () => {
                    // empty
                },
            },
        ],
        isSizeExceeded: () => false,
    };
});

const png = new File([], 'file.png', { type: 'image/png' });

describe('Composer attachments', () => {
    afterEach(clearAll);

    it('should not show embedded modal when plaintext mode', async () => {
        const message = {
            localID: ID,
            initialized: true,
            data: {
                ID,
                MIMEType: 'text/plain' as MIME_TYPES,
                Subject: '',
                ToList: [] as Recipient[],
            },
        } as MessageExtended;
        messageCache.set(ID, message);
        const { getByTestId, queryByText } = await render(<Composer {...props} messageID={ID} />);
        const inputAttachment = getByTestId('composer-attachments-button') as HTMLInputElement;
        fireEvent.change(inputAttachment, { target: { files: [png] } });
        await tick();
        const embeddedModal = queryByText('0 image detected');
        expect(embeddedModal).toBe(null);
        // TODO: Restore that test
        // await findByText('1 file attached');
    });
});
