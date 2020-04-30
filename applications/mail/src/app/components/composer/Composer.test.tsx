import { MIME_TYPES } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';
import React from 'react';
import { fireEvent } from '@testing-library/react';

import { clearAll, render, tick, messageCache } from '../../helpers/test/helper';
import Composer from './Composer';
import { MessageExtended } from '../../models/message';

const ID = 'ID';

const png = new File([], 'file.png', { type: 'image/png' });

const props = {
    focus: true,
    message: {},
    mailSettings: {} as MailSettings,
    addresses: [],
    onFocus: jest.fn(),
    onChange: jest.fn(),
    onClose: jest.fn()
};

describe('Composer', () => {
    afterEach(() => clearAll());

    it('should not show embedded modal when plaintext mode', async () => {
        const message = {
            localID: ID,
            initialized: true,
            data: {
                ID,
                MIMEType: 'text/plain' as MIME_TYPES,
                Subject: ''
            }
        } as MessageExtended;

        messageCache.set(ID, message);

        const { getByTestId, getByText, queryByText } = await render(<Composer {...props} messageID={ID} />);

        const inputAttachment = getByTestId('composer-attachments-button') as HTMLInputElement;

        fireEvent.change(inputAttachment, { target: { files: [png] } });

        await tick();

        const embeddedModal = queryByText('0 image detected');
        expect(embeddedModal).toBe(null);

        getByText('1 file attached');
    });
});
