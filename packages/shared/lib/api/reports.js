export const reportBug = ({
    OS,
    OSVersion,
    Browser,
    BrowserVersion,
    BrowserExtensions,
    Resolution,
    DisplayMode,
    Client,
    ClientVersion,
    ClientType,
    Title,
    Description,
    Username,
    Email,
    Country,
    ISP
}) => ({
    method: 'post',
    url: 'reports/bug',
    data: {
        OS,
        OSVersion,
        Browser,
        BrowserVersion,
        BrowserExtensions,
        Resolution,
        DisplayMode,
        Client,
        ClientVersion,
        ClientType,
        Title,
        Description,
        Username,
        Email,
        Country,
        ISP
    }
});

export const reportCrash = ({ OS, OSVersion, Browser, BrowserVersion, Client, ClientVersion, ClientType, Debug }) => ({
    method: 'post',
    url: 'reports/bug',
    data: {
        OS,
        OSVersion,
        Browser,
        BrowserVersion,
        Client,
        ClientVersion,
        ClientType,
        Debug
    }
});

// reportCrashSentryProxy  unclear API-spec

export const reportCSPViolation = (cspReport) => ({
    method: 'post',
    url: 'reports/csp',
    data: { 'csp-report': cspReport }
});

export const reportPishing = ({ MessageID, MIMEType, Body }) => ({
    method: 'post',
    url: 'reports/pishing',
    data: { MessageID, MIMEType, Body }
});
