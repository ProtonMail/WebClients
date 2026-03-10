interface BornPrivateParams {
    ParentEmail: string;
    ActivationKey: string;
}

interface BornPrivateRecoveryParams {
    ParentEmail: string;
    ReservedEmail: string;
    ActivationKey: string;
}

export const bornPrivate = (data: BornPrivateParams) => ({
    url: 'account/v1/born-private',
    method: 'post',
    data,
});

export const bornPrivateRecovery = (data: BornPrivateRecoveryParams) => ({
    url: 'account/v1/born-private/recover',
    method: 'post',
    data,
});
