interface BornPrivateRecoveryParams {
    ParentEmail: string;
    ReservedEmail: string;
    ActivationKey: string;
}

export const bornPrivateRecovery = (data: BornPrivateRecoveryParams) => ({
    url: 'account/v1/born-private/recover',
    method: 'post',
    data,
});
