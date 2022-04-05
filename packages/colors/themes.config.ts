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
        output: './themes/snow.theme.css',
        files: [
            {
                path: './themes/snow/standard-base.css',
                type: 'light',
            },
        ],
    },
    {
        output: './themes/carbon.theme.css',
        files: [
            {
                path: './themes/carbon/standard-base.css',
                type: 'dark',
            },
            {
                path: './themes/carbon/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/contrast.theme.css',
        files: [
            {
                path: './themes/contrast/standard-base.css',
                type: 'light',
            },
        ],
    },
    {
        output: './themes/duotone.theme.css',
        files: [
            {
                path: './themes/duotone/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/duotone/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/legacy.theme.css',
        files: [
            {
                path: './themes/legacy/standard-base.css',
                type: 'light',
            },
            {
                path: './themes/legacy/prominent-base.css',
                type: 'dark',
            },
        ],
    },
    {
        output: './themes/monokai.theme.css',
        files: [
            {
                path: './themes/monokai/standard-base.css',
                type: 'dark',
            },
            {
                path: './themes/monokai/prominent-base.css',
                type: 'dark',
            },
        ],
    },
];

export default config;
