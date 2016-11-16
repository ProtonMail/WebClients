angular.module('proton.attachments')
    .factory('attachmentEoApi', (embedded) => {

        const upload = (packets, message) => {

            const Headers = {};

            if (packets.Inline) {
                const cid = embedded.generateCid(`${packets.Filename}${packets.FileSize}`, message.SenderAddress);
                Headers['content-disposition'] = 'inline';
                Headers['content-id'] = cid;
            }

            return Promise.resolve({
                ID: btoa(`${packets.Filename}${Date.now()}`),
                Name: packets.Filename,
                Size: packets.FileSize,
                MIMEType: packets.MIMEType,
                KeyPackets: btoa(String.fromCharCode.apply(null, packets.keys)),
                Headers
            });
        };

        return { upload };
    });
