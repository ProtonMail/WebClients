/** List of known problematics regex coupled to adversarial inputs
 * They are used both for redos tests but also for measure testing */
export const EVASIONS = [
    {
        name: 'Ambiguous alternation 2-branch',
        re: /^https?:\/\/([a-z0-9]|[a-z0-9])+\.[a-z]{2,}$/,
        benign: 'https://example.com',
        adversarial: (n: number) => `https://${'a'.repeat(n)}.com/login`,
    },
    {
        name: 'Ambiguous alternation 2-branch overlapping classes',
        re: /^https?:\/\/([a-z0-9]|[a-z0-9-])+\.[a-z]{2,}$/,
        benign: 'https://my-site.com',
        adversarial: (n: number) => `https://accounts-${'a'.repeat(n)}.com/oauth`,
    },
    {
        name: 'Ambiguous alternation 3-branch',
        re: /^https?:\/\/([a-z]|[0-9]|[a-z0-9])+\.[a-z]{2,}$/,
        benign: 'https://example.com',
        adversarial: (n: number) => `https://${'a'.repeat(n)}.com/login`,
    },
    {
        name: 'Ambiguous alternation on path',
        re: /^https?:\/\/[a-z0-9.-]+\/([a-zA-Z]|[a-zA-Z0-9]|[a-zA-Z0-9_])+$/,
        benign: 'https://example.com/page',
        adversarial: (n: number) => `https://evil.com/${'a'.repeat(n)}!`,
    },
    {
        name: 'Ambiguous alternation on query string',
        re: /^https?:\/\/[a-z0-9.-]+\?([a-z]|[a-z0-9]|[a-z0-9=&])*$/,
        benign: 'https://example.com?q=1',
        adversarial: (n: number) => `https://evil.com?token=${'a'.repeat(n)}%20`,
    },
    {
        name: 'Prefix ambiguity 1-or-2 char segments',
        re: /^https?:\/\/([a-z0-9]|[a-z0-9][a-z0-9])+\.[a-z]{2,}$/,
        benign: 'https://example.com',
        adversarial: (n: number) => `https://${'a'.repeat(n)}.c0m`,
    },
    {
        name: 'Subset ambiguity hyphen branch',
        re: /^https?:\/\/([a-z0-9]+|[a-z0-9-]+)+\.[a-z]{2,}$/,
        benign: 'https://my-site.com',
        adversarial: (n: number) => `https://internal-${'a'.repeat(n)}.com:8080`,
    },
    {
        name: 'Subset ambiguity hyphen vs underscore',
        re: /^https?:\/\/[a-z0-9.-]+\/([a-z0-9-]|[a-z0-9_])+$/,
        benign: 'https://example.com/my-page',
        adversarial: (n: number) => `https://evil.com/reset-password-${'a'.repeat(n)}%`,
    },
    {
        name: 'Case alternation instead of /i flag',
        re: /^https?:\/\/([a-z0-9]|[A-Z0-9]|[a-zA-Z0-9])+\.[a-zA-Z]{2,}$/,
        benign: 'https://Example.com',
        adversarial: (n: number) => `https://${'A'.repeat(n)}.com/Login`,
    },
];

/** Real world URL the regex may be exposed to */
export const LOCATION_HREFS = {
    web: 'https://pass.proton.me/u/246/share/C3HMg0hohmVK5gHeyupW3i-jPPQVSPJISwGHw2mkaD_bb0X8iw5LgisgMfldTRkJAoAGakrZ7wOEN_g2LNMeiA==/item/D5aZqF8WSPFnJa06LLgZ0CiBpRbHgVE8oyenErQJUmn2xAOeqq0QLl1wwsSA8cqFQrKyGfqJn3gouQQl1vkOlw==/edit?filters=eyJzZWFyY2giOiIiLCJzb3J0IjoicmVjZW50IiwidHlwZSI6IioiLCJzZWxlY3RlZFNoYXJlSWQiOm51bGx9',
    ext: 'chrome-extension://ghmbeldphafepmbegfdlkpapadhbakde/popup.html#/u/3/share/2vLY5FjGzmQjGCKMIvobTT7bP4CMsQkFqjm7VDV48N8LGaznEc_aEUJfOi-bOoAdo_4V1IBN-Vw4LgzpBPZwkg==/item/4Qg7qVIo9Oix93CtLkPrwPJWjXj79jz6sRitrLWvYMvZhnHVQwcInyq1yax_x_V2A9NyYGN_4sQUsx1niNauLw==/edit?filters=eyJzZWFyY2giOiIiLCJzb3J0IjoicmVjZW50IiwidHlwZSI6IioiLCJzZWxlY3RlZFNoYXJlSWQiOm51bGx9',
};
