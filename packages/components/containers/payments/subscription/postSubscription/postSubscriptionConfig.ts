import type { PostSubscriptionFlowName, PostSubscriptionModalConfig } from './interface';
import DarkWebMonitoringPostSubscriptionModal from './modals/DarkWebMonitoringPostSubscriptionModal';
import GenericPostSubscriptionModal from './modals/GenericPostSubscriptionModal';
import MailAutoDeletePostSubscriptionModal from './modals/MailAutoDeletePostSubscriptionModal';
import MailFoldersPostSubscriptionModal from './modals/MailFoldersPostSubscriptionModal';
import MailLabelsPostSubscriptionModal from './modals/MailLabelsPostSubscriptionModal';
import MailShortDomainPostSubscriptionModal from './modals/MailShortDomainPostSubscriptionModal';
import SentinelPostSubscriptionModal from './modals/SentinelPostSubscriptionModal';

const postSubscriptionConfig: Record<PostSubscriptionFlowName, PostSubscriptionModalConfig> = {
    generic: {
        modal: GenericPostSubscriptionModal,
        featureTourSteps: [
            'short-domain',
            'auto-delete',
            'dark-web-monitoring',
            'mobile-app',
            'family-account',
            'duo-account',
            'other-features',
        ],
    },
    'mail-short-domain': {
        modal: MailShortDomainPostSubscriptionModal,
        featureTourSteps: ['auto-delete', 'dark-web-monitoring', 'mobile-app', 'family-account', 'other-features'],
    },
    'dark-web-monitoring': {
        modal: DarkWebMonitoringPostSubscriptionModal,
        featureTourSteps: ['short-domain', 'auto-delete', 'mobile-app', 'other-features'],
    },
    'mail-auto-delete': {
        modal: MailAutoDeletePostSubscriptionModal,
        featureTourSteps: ['short-domain', 'dark-web-monitoring', 'mobile-app', 'other-features'],
    },
    'mail-folders': {
        modal: MailFoldersPostSubscriptionModal,
        featureTourSteps: ['auto-delete', 'short-domain', 'dark-web-monitoring', 'mobile-app', 'other-features'],
    },
    'mail-labels': {
        modal: MailLabelsPostSubscriptionModal,
        featureTourSteps: ['auto-delete', 'short-domain', 'dark-web-monitoring', 'mobile-app', 'other-features'],
    },
    sentinel: {
        modal: SentinelPostSubscriptionModal,
        featureTourSteps: ['short-domain', 'auto-delete', 'dark-web-monitoring', 'mobile-app', 'other-features'],
    },
};

export default postSubscriptionConfig;
