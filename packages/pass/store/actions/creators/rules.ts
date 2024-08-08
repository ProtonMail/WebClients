import { websiteRulesRequest } from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';

export type ResolveWebsiteRulesPayload = {
    forceSync: boolean;
};

export const resolveWebsiteRules = requestActionsFactory<void, void>('website::rules::resolve')({
    requestId: websiteRulesRequest,
    success: { config: { maxAge: 2 * UNIX_DAY } },
});
