export interface SharedMetricsClient {
    docs_public_sharing_custom_password_success_rate_total: {
        increment: (labels: { status: string }) => void;
    };
}

const noopCounter = { increment: () => {} };

const noopClient: SharedMetricsClient = {
    docs_public_sharing_custom_password_success_rate_total: noopCounter,
};

let sharedMetricsClient: SharedMetricsClient = noopClient;

export const setSharedMetricsClient = (client: SharedMetricsClient) => {
    sharedMetricsClient = client;
};

export const getSharedMetricsClient = () => sharedMetricsClient;
