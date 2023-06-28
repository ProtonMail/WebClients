export interface GetEpochsParams {
    SinceEpochID?: number;
    Page?: number;
    PageSize?: number;
}

export const getEpochsRoute = (params: GetEpochsParams) => ({
    url: 'kt/epochs',
    method: 'get',
    params,
});

export interface GetCertificateParams {
    EpochID: number;
}

export const getCertificateRoute = ({ EpochID }: GetCertificateParams) => ({
    url: `kt/v1/epochs/${EpochID}`,
    method: 'get',
});

export interface GetProofParams {
    EpochID: number;
    Email: string;
    Revision: number;
}

export const getProofRoute = ({ EpochID, Email, Revision }: GetProofParams) => ({
    url: `kt/v1/epochs/${EpochID}/proof/${Email}/${Revision}`,
    method: 'get',
});

export interface GetLatestVerifiedEpochParams {
    AddressID: string;
}

export const getLatestVerifiedEpochRoute = ({ AddressID }: GetLatestVerifiedEpochParams) => ({
    url: `kt/v1/verifiedepoch/${AddressID}`,
    method: 'get',
});

export interface UploadVerifiedEpochPayload {
    AddressID: string;
    Data: string;
    Signature: string;
}

export const uploadVerifiedEpochRoute = ({ AddressID, ...data }: UploadVerifiedEpochPayload) => ({
    url: `kt/v1/verifiedepoch/${AddressID}`,
    method: 'put',
    data,
});
