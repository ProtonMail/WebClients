import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

export const KNOWN_REGISTRARS = new Map<number, { name: string; url?: string }>([
    [1068, { name: 'Namecheap', url: getKnowledgeBaseUrl('/custom-domain-godaddy') }],
    [1910, { name: 'Cloudflare', url: getKnowledgeBaseUrl('/custom-domain-cloudflare') }],
    [1861, { name: 'Porkbun', url: getKnowledgeBaseUrl('/custom-domain-porkbun') }],
    [468, { name: 'Amazon', url: getKnowledgeBaseUrl('/custom-domain-aws') }],
    [4316, { name: 'Amazon', url: getKnowledgeBaseUrl('/custom-domain-aws') }],
    [1154, { name: 'Bluehost', url: getKnowledgeBaseUrl('/custom-domain-bluehost') }],
    [81, { name: 'Gandi', url: getKnowledgeBaseUrl('/custom-domain-gandi') }],
    [1696, { name: 'Hostpoint', url: getKnowledgeBaseUrl('/custom-domain-hostpoint') }],
    [433, { name: 'OVH', url: getKnowledgeBaseUrl('/custom-domain-ovh') }],
    [146, { name: 'GoDaddy', url: getKnowledgeBaseUrl('/custom-domain-godaddy') }],
    [1659, { name: 'GoDaddy', url: getKnowledgeBaseUrl('/custom-domain-godaddy') }],
    [3786, { name: 'GoDaddy', url: getKnowledgeBaseUrl('/custom-domain-godaddy') }],
    [895, { name: 'Squarespace' }],
    [3827, { name: 'Squarespace' }],
    [0, { name: 'Other', url: getKnowledgeBaseUrl('/mail/custom-email-domain') }],
]);

export const DEFAULT_REGISTRAR = KNOWN_REGISTRARS.get(0)!;

export const getRegistrarByIANAId = (id: number | undefined) => {
    if (id === undefined) {
        return undefined;
    }

    const details = KNOWN_REGISTRARS.get(id);
    if (!details) {
        return undefined;
    }

    return {
        id,
        ...details,
    };
};
