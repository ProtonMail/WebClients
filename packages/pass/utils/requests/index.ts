import type { WebRequest } from 'webextension-polyfill';

/**
 * When intercepting xmlhttprequests, only
 * start tracking requests which "smell" like
 * a form submission : presence of formData in
 * the body without any errors.
 */
export const requestHasBodyFormData = ({ requestBody }: WebRequest.OnBeforeRequestDetailsType) => {
    return requestBody && !requestBody.error && (requestBody.formData || requestBody.raw);
};

export const isFailedRequest = ({ statusCode }: WebRequest.OnCompletedDetailsType) =>
    statusCode < 600 && statusCode >= 400;
