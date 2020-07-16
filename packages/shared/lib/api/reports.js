export const reportBug = (data, input) => ({
    method: 'post',
    url: 'reports/bug',
    input,
    data,
});

export const reportCrash = (data) => ({
    method: 'post',
    url: 'reports/bug',
    data,
});

// reportCrashSentryProxy  unclear API-spec

export const reportCSPViolation = (cspReport) => ({
    method: 'post',
    url: 'reports/csp',
    data: { 'csp-report': cspReport },
});

export const reportPhishing = ({ MessageID, MIMEType, Body }) => ({
    method: 'post',
    url: 'reports/phishing',
    data: { MessageID, MIMEType, Body },
});
