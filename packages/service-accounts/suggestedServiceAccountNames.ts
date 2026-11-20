import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export const SERVICE_ACCOUNT_NAME_SUGGESTIONS = [
    'ci-bot',
    'github-actions',
    'gitlab-ci',
    'deploy-bot',
    'release-pipeline',
    'terraform',
    'k8s-secrets-sync',
    'secrets-sync',
    'vault-sync',
    'ansible',
    'cert-renewal',
    'backup-job',
    'nightly-export',
    'scheduler',
    'crm-sync',
    'hr-onboarding',
    'it-provisioning',
    'helpdesk-bot',
    'ai-agent',
    'support-agent',
    'report-writer',
    'data-pipeline',
];

export const getSuggestedServiceAccountName = (existingNames: readonly string[]) => {
    const usedNames = new Set(existingNames.map((name) => name.trim().toLowerCase()));
    const available = SERVICE_ACCOUNT_NAME_SUGGESTIONS.filter((name) => !usedNames.has(name));
    const candidates = available.length ? available : SERVICE_ACCOUNT_NAME_SUGGESTIONS;
    const base = candidates[randomIntFromInterval(0, candidates.length - 1)];
    let name = base;
    let suffix = 1;
    while (usedNames.has(name)) {
        name = `${base}-${suffix++}`;
    }
    return name;
};
