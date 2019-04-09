export const reportBug = (data) => ({
    method: 'post',
    url: 'reports/bug',
    data
});

export const reportCrash = (data) => ({
    method: 'post',
    url: 'reports/bug',
    data
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
