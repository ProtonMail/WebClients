export interface SharedMetricsClient {
    core_webvitals_total: {
        increment: (labels: {
            type: 'CLS' | 'LCP' | 'INP';
            rating: 'good' | 'needs-improvement' | 'poor';
            context: 'public' | 'private';
        }) => void;
    };
    docs_public_sharing_custom_password_success_rate_total: {
        increment: (labels: { status: string }) => void;
    };
}

const noopCounter = { increment: () => {} };

const noopClient: SharedMetricsClient = {
    core_webvitals_total: noopCounter,
    docs_public_sharing_custom_password_success_rate_total: noopCounter,
};

let sharedMetricsClient: SharedMetricsClient = noopClient;

export const setSharedMetricsClient = (client: SharedMetricsClient) => {
    sharedMetricsClient = client;
};

export const getSharedMetricsClient = () => sharedMetricsClient;
