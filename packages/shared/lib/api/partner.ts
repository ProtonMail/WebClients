interface ClaimOrphanDomainPayload {
    Token: string;
}

export const claimOrphanDomain = (data: ClaimOrphanDomainPayload) => ({
    url: 'partner/v1/domain',
    method: 'put',
    data,
});

interface PartnerWhitelistPayload {
    Token: string;
}

export const partnerWhitelist = (data: PartnerWhitelistPayload) => ({
    url: 'partner/v1/whitelist',
    method: 'post',
    data,
});
