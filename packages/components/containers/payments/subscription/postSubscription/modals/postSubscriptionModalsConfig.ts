import type { PostSubscriptionModalConfig, PostSubscriptionModalName } from '../interface';
import MailShortDomainPostSubscriptionModal from './MailShortDomain';

const postSubscriptionModalsConfig: Record<PostSubscriptionModalName, PostSubscriptionModalConfig> = {
    'mail-short-domain': {
        component: MailShortDomainPostSubscriptionModal,
    },
};

export default postSubscriptionModalsConfig;
