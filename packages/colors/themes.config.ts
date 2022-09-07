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
        output: './themes/dist/contrast.theme.css',
        files: [
            {
                path: './themes/src/contrast/standard-base.css',
                type: 'light',
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
];

export default config;
