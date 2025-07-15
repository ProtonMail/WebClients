const CLIENT_ID_PREFIX = 'RetentionPolicyClientID:';

export const generateClientIDForRuleScope = () => {
    return CLIENT_ID_PREFIX + crypto.randomUUID();
};

export const isClientIDRuleScope = (id: string) => {
    return id.startsWith(CLIENT_ID_PREFIX);
};
