export const getEpochs = (params: { SinceEpochID?: number; Email?: string }) => ({
    url: 'kt/epochs',
    method: 'get',
    params,
});

export const getCertificate = ({ EpochID }: { EpochID: number }) => ({
    url: `kt/epochs/${EpochID}`,
    method: 'get',
});

export const getProof = ({ EpochID, Email }: { EpochID: number; Email: string }) => ({
    url: `kt/epochs/${EpochID}/proof/${Email}`,
    method: 'get',
});

export const getLatestVerifiedEpoch = ({ AddressID }: { AddressID: string }) => ({
    url: `kt/verifiedepoch/${AddressID}`,
    method: 'get',
});

export const uploadVerifiedEpoch = ({
    AddressID,
    Data,
    Signature,
}: {
    AddressID: string;
    Data: string;
    Signature: string;
}) => ({
    url: `kt/verifiedepoch/${AddressID}`,
    method: 'put',
    data: {
        Data,
        Signature,
    },
});
