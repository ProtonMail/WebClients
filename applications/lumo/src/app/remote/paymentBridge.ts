import {getClientID} from '@proton/shared/lib/apps/helper';
import {getAppVersionHeaders} from '@proton/shared/lib/fetch/headers';

import config from '../config';

interface Subscription {
    PaymentToken?: string;
    Cycle: number;
    Currency: string;
    Plans: Plan[];
    CouponCode?: string;
    BillingAddress?: string;
}

interface Plan {
    [key: string]: number;
}

interface InAppGooglePayload {
    purchaseToken: string;
    customerID: string;
    packageName: string;
    productID: string;
    orderID: string;
}

interface InAppAppleRecurringPayload {
    transactionID: string;
    productID: string;
    bundleID: string;
    receipt: string; // A base64 encoded string
}

enum Platform {
    IOS = 'ios',
    ANDROID = 'android',
}

/**
 * Payload for POST /api/payments/v5/tokens
 * Requires Amount and Currency.
 * Provide EITHER PaymentMethodID OR Payment details.
 */
interface PaymentTokenPayload {
    Amount: number; // Amount in cents
    Currency: string; // e.g., 'USD', 'EUR'
    PaymentMethodID?: string | null;
    /**
     * Use for In-App Purchases. Should contain EITHER InAppGooglePayload OR InAppAppleRecurringPayload.
     * Set to null or omit if using PaymentMethodID.
     */
    Payment?: {
        InAppGooglePayload?: InAppGooglePayload | null;
        InAppAppleRecurringPayload?: InAppAppleRecurringPayload | null;
    } | null;
}

// Sends the result/error of an API call back to the native side
const sendResultToNative = (callId: string, payload: any) => {
    const message = {callId, ...payload};
    console.log(`Payment Bridge: Sending message for callId ${callId}`, message);
    try {
        if ((window as any).webkit?.messageHandlers?.paymentApiHandler) {
            // Use a specific handler name
            (window as any).webkit.messageHandlers.paymentApiHandler.postMessage(message);
        } else if ((window as any).AndroidPaymentBridge?.postMessage) {
            // Use a specific Android bridge name
            (window as any).AndroidPaymentBridge.postMessage(JSON.stringify(message));
        } else {
            console.warn(`Payment Bridge: Native bridge not detected for callId ${callId}. Payload:`, payload);
        }
    } catch (e) {
        console.error(`Payment Bridge: Error sending message to native for callId ${callId}:`, e);
    }
};

// Wraps a PaymentApi method to be callable from native code
const createNativeWrapper = (methodName: keyof PaymentApi) => {
    return (callId: string, ...args: any[]) => {
        console.log(`Payment Bridge: Received call for ${methodName} with callId ${callId}`);
        const apiInstance = (window as any).paymentApiInstance;

        if (!apiInstance) {
            const errorMsg = 'PaymentApi instance not found on window.';
            console.error(`Payment Bridge: ${errorMsg}`);
            sendResultToNative(callId, {status: 'error', error: errorMsg});
            return;
        }

        const method = apiInstance[methodName];
        if (typeof method !== 'function') {
            const errorMsg = `Method ${methodName} not found on PaymentApi instance.`;
            console.error(`Payment Bridge: ${errorMsg}`);
            sendResultToNative(callId, {status: 'error', error: errorMsg});
            return;
        }

        try {
            // Ensure UID is set before calling methods that might need it
            if (!apiInstance.isUidSet() && methodName !== 'setUid') {
                const errorMsg = `UID not set for PaymentApi. Call setUid first.`;
                console.error(`Payment Bridge: ${errorMsg}`);
                sendResultToNative(callId, {status: 'error', error: errorMsg});
                return;
            }

            const result = method.apply(apiInstance, args);

            // Handle both promises and direct results (like setUid)
            if (result instanceof Promise) {
                result
                    .then((resData) => {
                        sendResultToNative(callId, {status: 'success', data: resData});
                    })
                    .catch((error) => {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.error(
                            `Payment Bridge: Error during async ${methodName} call for callId ${callId}:`,
                            error
                        );
                        sendResultToNative(callId, {status: 'error', error: errorMessage});
                    });
            } else {
                // Handle synchronous results (if any in the future, or for setUid)
                sendResultToNative(callId, {status: 'success', data: result});
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Payment Bridge: Synchronous error during ${methodName} call for callId ${callId}:`, error);
            sendResultToNative(callId, {status: 'error', error: errorMessage});
        }
    };
};

type UUIDResponse = any;

class PaymentApi {
    private uid: string | undefined;

    private authBaseUrl = '/api/auth/v4';

    private baseUrl = '/api/payments/v5';

    private inFlightUUID?: Promise<UUIDResponse>;

    constructor(uid?: string) {
        this.uid = uid;
        console.log('PaymentApi instance created.');
    }

    public setUid(uid: string): void {
        console.log(`PaymentApi: Setting UID`);
        this.uid = uid;
    }

    public isUidSet(): boolean {
        return !!this.uid;
    }

    private protonHeaders(platform?: Platform) {
        if (!this.uid) {
            throw new Error('UID must be set before making API calls.');
        }
        return {
            ...this.getAppVersion(platform),
            'x-pm-uid': this.uid,
            'Content-Type': 'application/json',
        };
    }

    private getAppVersion(platform?: Platform) {
        const headers: Record<string, string> = {};

        if (platform === 'ios') {
            headers['x-pm-appversion'] = 'ios-lumo@99.9.9';
        } else if (platform === 'android') {
            headers['x-pm-appversion'] = 'android-lumo@99.9.9';
        } else {
            return getAppVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);
        }

        return headers;
    }

    private async handleApiResponse(response: Response, context: string): Promise<any> {
        // Specific handling for GET /subscriptions 422 response
        if (context === 'getSubscriptions' && response.status === 422) {
            console.log(`Payment Bridge: Received 422 for getSubscriptions, interpreting as no subscriptions.`);
            // Assuming an empty array is the correct representation for "no subscriptions"
            return [];
        }

        if (!response.ok) {
            let errorBody = 'No error details available';
            try {
                // Try to parse error details from the backend
                const errorJson = await response.json();
                errorBody = JSON.stringify(errorJson);
            } catch (e) {
                // Ignore if parsing fails, use status text
                errorBody = response.statusText;
            }
            const errorMessage = `HTTP error during ${context}: ${response.status} ${errorBody}`;
            console.error(`Payment Bridge: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        // Handle cases with no content (e.g., 204 No Content)
        if (response.status === 204) {
            return null;
        }
        return {
            ...(await response.json()),
            uid: this.uid,
        };
    }

    // GET /subscriptions -> List Subscriptions
    public async getSubscriptions(platform?: Platform): Promise<any> {
        const url = `${this.baseUrl}/subscription`;
        console.log(`PaymentApi: GET ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: this.protonHeaders(platform),
        });
        return this.handleApiResponse(response, 'getSubscriptions');
    }

    // POST /tokens -> Create Payment Token
    public async postPaymentToken(payload: PaymentTokenPayload): Promise<any> {
        const url = `${this.baseUrl}/tokens`;
        console.log(`PaymentApi: POST ${url}`, payload); // Log payload for debugging
        if (!payload) throw new Error('Payload required for postPaymentToken');

        if (!payload.Amount || !payload.Currency) {
            throw new Error('Amount and Currency are required for postPaymentToken');
        }
        if (!payload.PaymentMethodID && !payload.Payment) {
            throw new Error('Either PaymentMethodID or Payment details must be provided for postPaymentToken');
        }
        if (payload.PaymentMethodID && payload.Payment) {
            console.warn(
                'PaymentApi: Both PaymentMethodID and Payment details provided to postPaymentToken. PaymentMethodID might be ignored by the API.'
            );
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: this.protonHeaders(),
            body: JSON.stringify(payload),
        });
        return this.handleApiResponse(response, 'postPaymentToken');
    }

    // POST /subscriptions -> Create/Update Subscription
    public async postSubscription(payload: Subscription): Promise<any> {
        const url = `${this.baseUrl}/subscriptions`;
        console.log(`PaymentApi: POST ${url}`);
        if (!payload) throw new Error('Payload required for postSubscription');
        const response = await fetch(url, {
            method: 'POST',
            headers: this.protonHeaders(),
            body: JSON.stringify(payload),
        });
        return this.handleApiResponse(response, 'postSubscription');
    }

    public async getUUID(): Promise<UUIDResponse> {

        // If a request is already running, reuse it.
        if (this.inFlightUUID) {
            return this.inFlightUUID;
        }

        this.inFlightUUID = (async () => {
            const url = `${this.authBaseUrl}/sessions/uuid`;
            console.log(`PaymentApi: GET ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: this.protonHeaders(),
            });

            const result = await this.handleApiResponse(response, 'getUUID');

            return result;
        })();

        try {
            return await this.inFlightUUID;
        } catch (e) {
            // If it failed, allow future calls to retry.
            this.inFlightUUID = undefined;
            throw e;
        }
    }

    public async getPlans(platform?: Platform): Promise<any> {
        const url = `${this.baseUrl}/plans`;
        console.log(`PaymentApi: GET ${url}`);

        var requireUUID = platform == 'ios';

        let uuidData = null;
        if (requireUUID) {
            uuidData = await this.getUUID();
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: this.protonHeaders(platform),
        });

        const plansData = await this.handleApiResponse(response, 'getPlans');

        // Inject UUID data if requested
        if (requireUUID && uuidData) {
            return {
                ...plansData,
                uuid: uuidData.UUID,
            };
        }

        return plansData;
    }
}

// Bridge Setup
try {
    // Instantiate and expose the PaymentApi
    (window as any).paymentApiInstance = new PaymentApi();
    console.log('Payment Bridge: PaymentApi instance created and exposed as window.paymentApiInstance');

    // Expose wrapped methods for native calls
    (window as any).nativePaymentApi = {
        // Expose setUid separately if needed, requires careful handling of callId response
        setUid: createNativeWrapper('setUid'),
        getPlans: createNativeWrapper('getPlans'),
        postPaymentToken: createNativeWrapper('postPaymentToken'),
        postSubscription: createNativeWrapper('postSubscription'),
        getSubscriptions: createNativeWrapper('getSubscriptions'),
    };
    console.log('Payment Bridge: Native wrapper functions created under window.nativePaymentApi');

    // Signal readiness (use a unique callId or convention)
    sendResultToNative('paymentBridgeReady', {status: 'success', data: 'Payment API bridge initialized'});
} catch (error) {
    console.error('Payment Bridge: Failed to initialize PaymentApi bridge:', error);
    // Optionally notify native side about the failure
    sendResultToNative('paymentBridgeError', {status: 'error', error: 'Failed to initialize Payment API bridge'});
}
