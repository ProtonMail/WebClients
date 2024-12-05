import type { PostSubscriptionFlowName, PostSubscriptionModalConfig } from './interface';
import MailShortDomainPostSubscriptionModal from './mail-short-domain/MailShortDomainPostSubscriptionModal';

const postSubscriptionConfig: Record<PostSubscriptionFlowName, PostSubscriptionModalConfig> = {
    'mail-short-domain': {
        modal: MailShortDomainPostSubscriptionModal,
    },
};

export default postSubscriptionConfig;
