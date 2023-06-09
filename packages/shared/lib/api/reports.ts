import { CLIENT_TYPES } from '@proton/shared/lib/constants';

export interface BugPayload {
    ClientType: CLIENT_TYPES;
    Client: string;
    ClientVersion: string;
    Title: string;
    Description: string;
    Email: string;
    Username: string;
    OS: string;
    OSVersion: string;
    Browser: string | undefined;
    BrowserVersion: string | undefined;
    Resolution: string;
    DeviceName: string | undefined;
    DeviceModel: string | undefined;
}

export const reportBug = (data: BugPayload, input?: 'form') => ({
    method: 'post',
    url: 'reports/bug',
    input,
    data,
});

interface PhishingPayload {
    MessageID?: string;
    MIMEType: 'text/plain' | 'text/html';
    Body?: string;
}

export const reportPhishing = ({ MessageID, MIMEType, Body }: PhishingPayload) => ({
    method: 'post',
    url: 'reports/phishing',
    data: { MessageID, MIMEType, Body },
});
