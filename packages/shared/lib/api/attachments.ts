export const getAttachment = (attachmentID: string) => ({
    method: 'get',
    url: `mail/v4/attachments/${attachmentID}`,
    output: 'arrayBuffer',
});

export const uploadAttachment = (data: {
    Filename: string;
    MessageID: string;
    ContentID: string;
    MIMEType: string;
    KeyPackets: Blob;
    DataPacket: Blob;
    Signature?: Blob;
}) => ({
    method: 'post',
    url: 'mail/v4/attachments',
    input: 'form',
    data,
});

export const removeAttachment = (attachmentID: string, messageID: string) => ({
    method: 'delete',
    url: `mail/v4/attachments/${attachmentID}`,
    params: { MessageID: messageID },
});
