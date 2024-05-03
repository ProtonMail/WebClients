import { api } from '@proton/pass/lib/api/api';
import type {
    BreachCustomEmailGetResponse,
    BreachEmailCreateRequest,
    BreachEmailValidateRequest,
    BreachUpdateCustomEmailRequest,
    BreachUpdateMonitorAddressRequest,
    BreachesGetResponse,
    BreachesResponse,
    UpdateUserMonitorStateRequest,
} from '@proton/pass/types/api/pass';
import type { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';

/** Toggle the ProtonSentinel setting */
export const toggleSentinel = (value: SETTINGS_PROTON_SENTINEL_STATE) =>
    api({ url: `core/v4/settings/highsecurity`, method: value ? 'post' : 'delete' });

/** Update PassMonitor settings */
export const setMonitorSettings = async (data: UpdateUserMonitorStateRequest): Promise<UpdateUserMonitorStateRequest> =>
    (await api({ url: 'pass/v1/user/monitor', method: 'put', data })).Monitor!;

/* Get all the breaches for this user (Proton addresses) */
export const getAllBreaches = async (): Promise<BreachesGetResponse> =>
    (await api({ url: 'pass/v1/breach', method: 'get' })).Breaches!;

/* Get breaches for a proton address */
export const getBreachesForProtonAddress = async (AddressID: string): Promise<BreachesResponse> =>
    (await api({ url: `pass/v1/breach/address/${AddressID}/breaches`, method: 'get' })).Breaches!;

/** Get breaches for custom email */
export const getCustomEmailBreaches = async (customEmailId: string): Promise<BreachesResponse> =>
    (await api({ url: `pass/v1/breach/custom_email/${customEmailId}/breaches`, method: 'get' })).Breaches!;

/* Get breaches for an alias item */
export const getAliasBreaches = async (shareId: string, itemId: string): Promise<BreachesResponse> =>
    (await api({ url: `pass/v1/share/${shareId}/alias/${itemId}/breaches`, method: 'get' })).Breaches!;

/* Update the monitor status for a Proton Address */
export const setMonitorForProtonAddress = (AddressID: string, monitor: BreachUpdateMonitorAddressRequest) =>
    api({ url: `pass/v1/breach/address/${AddressID}/monitor`, method: 'put', data: monitor });

/** Add a custom email to breaches monitoring */
export const monitorCustomEmail = async (data: BreachEmailCreateRequest): Promise<BreachCustomEmailGetResponse> =>
    (await api({ url: `pass/v1/breach/custom_email`, method: 'post', data })).Email!;

/** Remove a custom email from breaches monitoring */
export const deleteCustomEmail = async (addressId: string): Promise<boolean> =>
    api({ url: `pass/v1/breach/custom_email/${addressId}`, method: 'delete' }).then(() => true);

/** Update the monitor status for a custom email */
export const toggleCustomEmail = async (
    addressId: string,
    data: BreachUpdateCustomEmailRequest
): Promise<BreachCustomEmailGetResponse> =>
    (await api({ url: `pass/v1/breach/custom_email/${addressId}/monitor`, method: 'put', data })).Email!;

/** Update the monitor status for a custom email */
export const toggleProtonEmail = (addressId: string, data: BreachUpdateCustomEmailRequest): Promise<boolean> =>
    api({ url: `pass/v1/breach/address/${addressId}/monitor`, method: 'put', data }).then(() => true);

/** Mark a Proton address as resolved */
export const setBreachedProtonAddressResolved = (AddressID: string): Promise<boolean> =>
    api({ url: `pass/v1/breach/address/${AddressID}/resolved`, method: 'post' }).then(() => true);

/** Mark alias breaches as resolved */
export const setBreachedAliasResolved = (shareId: string, itemId: string): Promise<boolean> =>
    api({ url: `pass/v1/share/${shareId}/alias/${itemId}/breaches/resolved`, method: 'post' }).then(() => true);

/** Mark custom email breaches as resolved */
export const setBreachedCustomEmailResolved = (customEmailId: string): Promise<boolean> =>
    api({ url: `pass/v1/breach/custom_email/${customEmailId}/resolved`, method: 'put' }).then(() => true);

/** Verify a custom email with the validation code */
export const verifyCustomEmail = async (
    addressId: string,
    data: BreachEmailValidateRequest
): Promise<BreachCustomEmailGetResponse> =>
    (await api({ url: `pass/v1/breach/custom_email/${addressId}/verify`, method: 'put', data })).Email!;

/** Re-send the verification email for custom address */
export const resendVerificationCustomEmail = (addressId: string): Promise<boolean> =>
    api({ url: `pass/v1/breach/custom_email/${addressId}/resend_verification`, method: 'post' }).then(() => true);
