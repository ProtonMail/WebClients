/* eslint-disable jsx-a11y/anchor-ambiguous-text */
import type { ReactNode } from 'react';

import { Href } from '@proton/atoms';
import type { CompatibilityItem } from '@proton/components/containers/compatibilityCheck/compatibilityCheckHelper';
import { PASS_TROUBLESHOOT_URL } from '@proton/pass/constants';
import { hasWASMSupport } from '@proton/pass/utils/dom/wasm';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getBrowser, isEdge, isSafari } from '@proton/shared/lib/helpers/browser';

const getWhiteListMessage = (feature: string) => (
    <strong key="browser-warning">
        If using {getBrowser().name} in {feature} Mode, please allow {BRAND_NAME} domains in your security settings.{' '}
    </strong>
);

const getWASMMessage = (): ReactNode => {
    const detail = (() => {
        if (isEdge()) return getWhiteListMessage('Enhanced Security');
        if (isSafari()) return getWhiteListMessage('Lockdown');
        return null;
    })();

    return [
        'Please update to a modern browser with WASM support. ',
        detail,
        <Href href={PASS_TROUBLESHOOT_URL} className="text-underline text-no-cut" key="learn-more-link">
            Learn more.
        </Href>,
    ];
};

export const PASS_WEB_COMPAT: CompatibilityItem[] = [
    {
        name: 'WebAssembly',
        valid: hasWASMSupport(),
        text: getWASMMessage(),
    },
];
