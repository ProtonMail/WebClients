export const REDIRECT_CONFIG = {
    // Domains that should trigger redirects
    SOURCE_DOMAINS: ['lumo.proton.me', 'lumo.proton.dev'] as const,
    TARGET_DOMAIN: 'https://proton.me',
} as const;
