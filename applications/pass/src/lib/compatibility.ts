import type { CompatibilityItem } from '@proton/components/containers/compatibilityCheck/compatibilityCheckHelper';
import { hasWASMSupport } from '@proton/pass/utils/dom/wasm';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { isEdge, isSafari } from '@proton/shared/lib/helpers/browser';

const getWhiteListMessage = (feature: string) =>
    `If "${feature}" is enabled, please whitelist ${BRAND_NAME} domains from your security settings and restart your browser.`;

export const PASS_WEB_COMPAT: CompatibilityItem[] = [
    {
        name: 'WebAssembly',
        valid: hasWASMSupport(),
        text: [
            `Please update to a modern browser with WebAssembly support`,
            isEdge() && getWhiteListMessage('Edge Enhanced Security'),
            isSafari() && getWhiteListMessage('Safari Lockdown Mode'),
        ]
            .filter(truthy)
            .join('. '),
    },
];
