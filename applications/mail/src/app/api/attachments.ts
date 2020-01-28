export const getAttachment = (attachmentID: string) => ({
    method: 'get',
    url: `attachments/${attachmentID}`,
    output: 'arrayBuffer'
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
    url: 'attachments',
    input: 'form',
    data
});

export const removeAttachment = (attachmentID: string, messageID: string) => ({
    method: 'delete',
    url: `attachments/${attachmentID}`,
    params: { MessageID: messageID }
});
