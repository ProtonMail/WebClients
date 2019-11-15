export const getAttachment = (attachmentID) => ({
    method: 'get',
    url: `attachments/${attachmentID}`,
    output: 'arrayBuffer'
});
