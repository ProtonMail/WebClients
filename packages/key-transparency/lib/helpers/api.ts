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
    Identifier: string;
    Revision: number;
}

export const getProofRoute = ({ EpochID, Identifier, Revision }: GetProofParams) => ({
    url: `kt/v1/epochs/${EpochID}/proof?Identifier=${encodeURIComponent(Identifier)}&Revision=${Revision}`,
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
