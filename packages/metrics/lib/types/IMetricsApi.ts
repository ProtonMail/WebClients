export default interface IMetricsApi {
    setAuthHeaders: (uid: string, accessToken?: string) => void;
    setVersionHeaders: (clientID: string, appVersion: string) => void;
    fetch: (requestInfo: RequestInfo | URL, requestInit?: RequestInit, retries?: number) => Promise<Response | void>;
}
