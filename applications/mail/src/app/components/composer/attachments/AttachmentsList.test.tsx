import React from 'react';

import { clearAll, render } from '../../../helpers/test/helper';
import AttachmentsList from './AttachmentsList';
import { EmbeddedInfo, EmbeddedMap, MessageExtended } from '../../../models/message';

const localID = 'localID';

const props = {
    message: { localID },
    onRemoveAttachment: jest.fn(),
    onRemoveUpload: jest.fn()
};

const normalAttachment = {};
const cid = 'cid';
const embeddedAttachment = { Headers: { 'content-id': cid } };

describe('AttachmentsList', () => {
    afterEach(() => clearAll());

    it('should show attachments count', async () => {
        const message = { localID, data: { Attachments: [normalAttachment] } } as MessageExtended;
        const { getByText } = await render(<AttachmentsList {...props} message={message} />);
        getByText(/1 file attached/);
    });

    it('should show embedded count', async () => {
        const embeddedInfo: EmbeddedInfo = { attachment: embeddedAttachment, url: 'url' };
        const embeddeds: EmbeddedMap = new Map<string, EmbeddedInfo>([[cid, embeddedInfo]]);
        const message = ({ localID, embeddeds, data: { Attachments: [embeddedAttachment] } } as any) as MessageExtended;
        const { getByText } = await render(<AttachmentsList {...props} message={message} />);
        getByText(/1 embedded image/);
    });

    it('should show attachments count and embedded count', async () => {
        const embeddedInfo: EmbeddedInfo = { attachment: embeddedAttachment, url: 'url' };
        const embeddeds: EmbeddedMap = new Map<string, EmbeddedInfo>([[cid, embeddedInfo]]);
        const message = ({
            localID,
            embeddeds,
            data: { Attachments: [normalAttachment, embeddedAttachment] }
        } as any) as MessageExtended;
        const { getByText } = await render(<AttachmentsList {...props} message={message} />);
        getByText(/1 file attached/);
        getByText(/1 embedded image/);
    });
});
