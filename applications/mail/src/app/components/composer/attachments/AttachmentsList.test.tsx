import React from 'react';

import { clearAll, render } from '../../../helpers/test/helper';
import AttachmentsList from './AttachmentsList';
import { EmbeddedInfo, EmbeddedMap } from '../../../models/message';

const props = {
    message: {},
    onRemoveAttachment: jest.fn(),
    onRemoveUpload: jest.fn()
};

const normalAttachment = {};
const cid = 'cid';
const embeddedAttachment = { Headers: { 'content-id': cid } };

describe('AttachmentsList', () => {
    afterEach(() => clearAll());

    it('should show attachments count', async () => {
        const message = { data: { Attachments: [normalAttachment] } };
        const { getByText } = await render(<AttachmentsList {...props} message={message} />);
        getByText(/1 file attached/);
    });

    it('should show embedded count', async () => {
        const embeddedInfo: EmbeddedInfo = { attachment: embeddedAttachment, url: 'url' };
        const embeddeds: EmbeddedMap = new Map<string, EmbeddedInfo>([[cid, embeddedInfo]]);
        const message = { embeddeds, data: { Attachments: [embeddedAttachment] } };
        const { getByText } = await render(<AttachmentsList {...props} message={message} />);
        getByText(/1 embedded image/);
    });

    it('should show attachments count and embedded count', async () => {
        const embeddedInfo: EmbeddedInfo = { attachment: embeddedAttachment, url: 'url' };
        const embeddeds: EmbeddedMap = new Map<string, EmbeddedInfo>([[cid, embeddedInfo]]);
        const message = { embeddeds, data: { Attachments: [normalAttachment, embeddedAttachment] } };
        const { getByText } = await render(<AttachmentsList {...props} message={message} />);
        getByText(/1 file attached/);
        getByText(/1 embedded image/);
    });
});
