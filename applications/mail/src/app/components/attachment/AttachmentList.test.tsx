import React from 'react';

import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { clearAll, render } from '../../helpers/test/helper';
import AttachmentList, { AttachmentAction } from './AttachmentList';
import { EmbeddedInfo, EmbeddedMap, MessageExtendedWithData } from '../../models/message';

const localID = 'localID';

const props = {
    message: { localID, data: {} } as MessageExtendedWithData,
    primaryAction: AttachmentAction.Download,
    secondaryAction: AttachmentAction.Remove,
    collapsable: true,
    showDownloadAll: false,
    onRemoveAttachment: jest.fn(),
    onRemoveUpload: jest.fn(),
};

const normalAttachment = {};
const cid = 'cid';
const embeddedAttachment = { Headers: { 'content-id': cid } };

describe('AttachmentsList', () => {
    afterEach(() => clearAll());

    it('should show attachments count', async () => {
        const attachments = [normalAttachment] as Attachment[];
        const { getByText, queryByText } = await render(<AttachmentList {...props} attachments={attachments} />);
        getByText('file attached');
        expect(queryByText('embedded image')).toBe(null);
    });

    it('should show embedded count', async () => {
        const attachments = [embeddedAttachment];
        const embeddedInfo: EmbeddedInfo = { attachment: embeddedAttachment, url: 'url' };
        const embeddeds: EmbeddedMap = new Map<string, EmbeddedInfo>([[cid, embeddedInfo]]);
        const { getByText, queryByText } = await render(
            <AttachmentList {...props} attachments={attachments} embeddeds={embeddeds} />
        );
        getByText('embedded image');
        expect(queryByText('file attached')).toBe(null);
    });

    it('should show attachments count and embedded count', async () => {
        const attachments = [normalAttachment, embeddedAttachment];
        const embeddedInfo: EmbeddedInfo = { attachment: embeddedAttachment, url: 'url' };
        const embeddeds: EmbeddedMap = new Map<string, EmbeddedInfo>([[cid, embeddedInfo]]);
        const { getByText } = await render(
            <AttachmentList {...props} attachments={attachments} embeddeds={embeddeds} />
        );
        getByText('file attached');
        getByText('embedded image');
    });
});
