import type { Recipient } from '@proton/shared/lib/interfaces';

export const fromFields = {
    fromAddress: 'from@protonmail.com',
    fromName: 'From',
    meAddress: 'me@protonmail.com',
    meName: 'Me',
    toAddress: 'to@protonmail.com',
    toName: 'To',
    ccAddress: 'cc@protonmail.com',
    ccName: 'CC',
    bccAddress: 'bcc@protonmail.com',
    bccName: 'BCC',
};

export const recipients: Record<string, Recipient> = {
    fromRecipient: {
        Name: fromFields.fromName,
        Address: fromFields.fromAddress,
    },
    meRecipient: { Name: fromFields.meName, Address: fromFields.meAddress },
    toRecipient: { Name: fromFields.toName, Address: fromFields.toAddress },
    ccRecipient: { Name: fromFields.ccName, Address: fromFields.ccAddress },
    bccRecipient: { Name: fromFields.bccName, Address: fromFields.bccAddress },
};

export const protonSignature = 'Sent with Proton Mail secure email.';
