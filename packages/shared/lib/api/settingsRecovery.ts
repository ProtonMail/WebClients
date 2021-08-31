interface NewRecoverySecretPayload {
    RecoverySecret: string;
    Signature: string;
}
export const setNewRecoverySecret = (data: NewRecoverySecretPayload) => ({
    url: 'core/v4/settings/recovery/secret',
    method: 'post',
    data,
});

export const deleteRecoverySecrets = () => ({
    url: 'core/v4/settings/recovery/secret',
    method: 'delete',
});
