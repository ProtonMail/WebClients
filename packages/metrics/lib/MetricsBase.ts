import { IMetricsRequestService } from './MetricsRequestService';

export default class MetricsBase {
    protected requestService: IMetricsRequestService;

    constructor(requestService: IMetricsRequestService) {
        this.requestService = requestService;
    }

    public init({ uid, clientID, appVersion }: { uid: string; clientID: string; appVersion: string }) {
        this.setAuthHeaders(uid);
        this.setVersionHeaders(clientID, appVersion);
    }

    public setVersionHeaders(clientID: string, appVersion: string) {
        this.requestService.api.setVersionHeaders(clientID, appVersion);
    }

    public setAuthHeaders(uid: string) {
        this.requestService.api.setAuthHeaders(uid);
    }

    public clearAuthHeaders() {
        this.requestService.api.setAuthHeaders('');
    }

    public setReportMetrics(reportMetrics: boolean) {
        this.requestService.setReportMetrics(reportMetrics);
    }

    public processAllRequests() {
        return this.requestService.processAllRequests();
    }
}
