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
    note: string;
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
        note: c('collider_2025:Info')
            .t`OpenAI will email you a download link. It can take some time depending on export size, and the link expires in 24 hours. Data exports are only available for consumer ChatGPT accounts, not Business or Enterprise accounts.`,
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
        note: c('collider_2025:Info')
            .t`Anthropic will email you a download link when your export is ready. The link expires after a limited time, so download it promptly.`,
    },
];
