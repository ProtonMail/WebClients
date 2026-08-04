import { c } from 'ttag';

import chatgptLogo from '@proton/styles/assets/img/lumo/trail/chatgpt.svg';
import claudeLogo from '@proton/styles/assets/img/lumo/trail/claude.svg';

export type ExportPlatform = 'chatgpt' | 'claude';

export interface PlatformExportGuide {
    id: ExportPlatform;
    name: string;
    provider: string;
    logo: string;
    steps: string[];
}

export const EXPORT_PLATFORMS: PlatformExportGuide[] = [
    {
        id: 'chatgpt',
        name: 'ChatGPT',
        provider: 'OpenAI',
        logo: chatgptLogo,
        steps: [
            c('collider_2025:Info').t`Sign in to your ChatGPT account on chatgpt.com`,
            c('collider_2025:Info').t`Click your profile icon in the bottom-left corner of the page`,
            c('collider_2025:Info').t`Click Settings → Data controls`,
            c('collider_2025:Info').t`Look for Export data, then click Export`,
            c('collider_2025:Info').t`In the pop-up window, click Confirm export`,
        ],
    },
    {
        id: 'claude',
        name: 'Claude',
        provider: 'Anthropic',
        logo: claudeLogo,
        steps: [
            c('collider_2025:Info').t`Sign in to your Claude account at claude.ai`,
            c('collider_2025:Info').t`Click your profile icon in the bottom-left corner of the page`,
            c('collider_2025:Info').t`Click Settings → Privacy`,
            c('collider_2025:Info').t`Under your data, click Export data`,
            c('collider_2025:Info').t`Follow the prompts to confirm the export`,
        ],
    },
];
