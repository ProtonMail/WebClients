export interface SharedMetricsClient {
    setAuthHeaders: (uid: string, accessToken?: string) => void;
    core_event_loop_five_processing_time_histogram: {
        observe: (args: { Value: number; Labels: Record<string, string> }) => void;
    };
    core_event_loop_six_processing_time_histogram: {
        observe: (args: { Value: number; Labels: Record<string, string> }) => void;
    };
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

const noopHistogram = { observe: () => {} };
const noopCounter = { increment: () => {} };

const noopClient: SharedMetricsClient = {
    setAuthHeaders: () => {},
    core_event_loop_five_processing_time_histogram: noopHistogram,
    core_event_loop_six_processing_time_histogram: noopHistogram,
    core_webvitals_total: noopCounter,
    docs_public_sharing_custom_password_success_rate_total: noopCounter,
};

let sharedMetricsClient: SharedMetricsClient = noopClient;

export const setSharedMetricsClient = (client: SharedMetricsClient) => {
    sharedMetricsClient = client;
};

export const resetSharedMetricsClient = () => {
    sharedMetricsClient = noopClient;
};

export const getSharedMetricsClient = () => sharedMetricsClient;
