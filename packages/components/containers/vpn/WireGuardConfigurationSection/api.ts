import { PaginationParams } from '@proton/shared/lib/api/interface';
import { CertificateDeletionParams, CertificateGenerationParams } from './Certificate';

export enum CertificateMode {
    SESSION = 'session',
    PERSISTENT = 'persistent',
}

export interface CertificateListParams extends PaginationParams {
    Offset?: number;
    Limit?: number;
    Sort?: string;
    Desc?: 0 | 1;
    WithSessions?: 0 | 1;
    Mode?: CertificateMode;
    BeginID?: string;
}

export const queryVPNClientConfig = () => ({
    url: 'vpn/v2/clientconfig',
    method: 'get',
});

export const getKey = () => ({
    url: 'vpn/v1/certificate/key/EC',
    method: 'get',
});

export const generateCertificate = (data: CertificateGenerationParams) => ({
    url: 'vpn/v1/certificate',
    method: 'post',
    data,
});

export const queryCertificates = (params?: CertificateListParams) => ({
    url: 'vpn/v1/certificate/all',
    method: 'get',
    params,
});

export const deleteCertificates = (data: CertificateDeletionParams) => ({
    url: 'vpn/v1/certificate',
    method: 'delete',
    data,
});
