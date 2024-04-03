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
    url: 'core/v4/reports/bug',
    input,
    data,
});

export const closeTicket = (ticketID: number, RequesterID: number, CreatedAt: string, BrandID?: number) => ({
    method: 'delete',
    url: `core/v4/reports/bug/${ticketID}`,
    params: {
        RequesterID,
        CreatedAt,
        BrandID,
    },
});

interface PhishingPayload {
    MessageID?: string;
    MIMEType: 'text/plain' | 'text/html';
    Body?: string;
}

export const reportPhishing = ({ MessageID, MIMEType, Body }: PhishingPayload) => ({
    method: 'post',
    url: 'core/v4/reports/phishing',
    data: { MessageID, MIMEType, Body },
});

interface CancelPlanPayload {
    Reason: string;
    Message: string;
    Email: string;
    OS: string;
    OSVersion: string;
    Browser: string | undefined;
    BrowserVersion: string | undefined;
    Client: string;
    ClientVersion: string;
    ClientType: CLIENT_TYPES;
    Tags: string[];
}

export const reportCancelPlan = (data: CancelPlanPayload) => ({
    method: 'post',
    url: 'core/v4/reports/cancel-plan',
    data,
});
