export type ThemeFileType = 'light' | 'dark';

export interface FileConfig {
    path: string;
    type: ThemeFileType;
}

export interface ThemeConfig {
    output: string;
    files: FileConfig[];
}

const config: ThemeConfig[] = [
    {
        output: './themes/dist/snow.theme.css',
        files: [
            {
                path: './themes/src/snow/standard-base.css',
                type: 'light',
            },
        ],
    },
    {
        output: './themes/dist/classic.theme.css',
        files: [
            {
                path: './themes/src/classic/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/src/classic/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/carbon.theme.css',
        files: [
            {
                path: './themes/src/carbon/standard-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/contrast-light.theme.css',
        files: [
            {
                path: './themes/src/contrast-light/standard-base.css',
                type: 'light',
            },
        ],
    },
    {
        output: './themes/dist/contrast-dark.theme.css',
        files: [
            {
                path: './themes/src/contrast-dark/standard-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/contrast-dark/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/duotone.theme.css',
        files: [
            {
                path: './themes/src/duotone/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/src/duotone/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/legacy.theme.css',
        files: [
            {
                path: './themes/src/legacy/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/src/legacy/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/monokai.theme.css',
        files: [
            {
                path: './themes/src/monokai/standard-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/pass-dark.theme.css',
        files: [
            {
                path: './themes/src/pass-dark/standard-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/pass-dark/violet-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/pass-dark/teal-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/pass-dark/orange-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/pass-dark/red-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/pass-dark/lime-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/pass-dark/gray-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/pass-light.theme.css',
        files: [
            {
                path: './themes/src/pass-light/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/src/pass-light/violet-base.css',
                type: 'light',
            },
            {
                path: './themes/src/pass-light/teal-base.css',
                type: 'light',
            },
            {
                path: './themes/src/pass-light/orange-base.css',
                type: 'light',
            },
            {
                path: './themes/src/pass-light/red-base.css',
                type: 'light',
            },
            {
                path: './themes/src/pass-light/lime-base.css',
                type: 'light',
            },
            {
                path: './themes/src/pass-light/gray-base.css',
                type: 'light',
            },
        ],
    },
    {
        output: './themes/dist/storefront.theme.css',
        files: [
            {
                path: './themes/src/storefront/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/src/storefront/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/wallet-light.theme.css',
        files: [
            {
                path: './themes/src/wallet-light/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/src/wallet-light/ui-blue.css',
                type: 'light',
            },
            {
                path: './themes/src/wallet-light/ui-green.css',
                type: 'light',
            },
            {
                path: './themes/src/wallet-light/ui-orange.css',
                type: 'light',
            },
            {
                path: './themes/src/wallet-light/ui-pink.css',
                type: 'light',
            },
            {
                path: './themes/src/wallet-light/ui-purple.css',
                type: 'light',
            },
        ],
    },
    {
        output: './themes/dist/wallet-dark.theme.css',
        files: [
            {
                path: './themes/src/wallet-dark/standard-base.css',
                type: 'dark',
            },
            {
                path: './themes/src/wallet-dark/ui-blue.css',
                type: 'dark',
            },
            {
                path: './themes/src/wallet-dark/ui-green.css',
                type: 'dark',
            },
            {
                path: './themes/src/wallet-dark/ui-orange.css',
                type: 'dark',
            },
            {
                path: './themes/src/wallet-dark/ui-pink.css',
                type: 'dark',
            },
            {
                path: './themes/src/wallet-dark/ui-purple.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/dist/storefront-wallet.theme.css',
        files: [
            {
                path: './themes/src/storefront-wallet/standard-base.css',
                type: 'light',
            },
        ],
    },
    {
        output: './themes/dist/lumo-light.theme.css',
        files: [
            {
                path: './themes/src/lumo-light/light-base.css',
                type: 'light',
            },
        ],
    },
];

export default config;
