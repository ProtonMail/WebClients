import { type WorkerContextInterface } from 'proton-pass-extension/app/worker/context';
import type { Runtime } from 'webextension-polyfill';

import type { WebsiteRulesMessage } from '@proton/pass/types';
import { isValidWebsiteRulesJson } from '@proton/pass/types';

/* Verbose parameters to simplify testing */
export const getWebsiteRules = async (
    ctx: WorkerContextInterface,
    _: WebsiteRulesMessage,
    sender: Runtime.MessageSender
) => {
    try {
        const websiteRules = await ctx.service.storage.local.getItem('websiteRules');
        const parsedRules = websiteRules ? JSON.parse(websiteRules) : null;

        if (!isValidWebsiteRulesJson(parsedRules) || !sender.url) throw new Error();

        const url = new URL(sender.url);
        const base = url.hostname;
        /* We use replace() so that example.com/path/ becomes example.com/path */
        const withPath = url.pathname !== '/' ? url.hostname + url.pathname.replace(/\/$/, '') : null;

        return {
            result: (parsedRules.rules[base] ?? []).concat(withPath ? (parsedRules.rules[withPath] ?? []) : []),
        };
    } catch (_) {
        return { result: null };
    }
};
