import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasFree } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS, DOCS_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import DriveLogo from '../../../../../../components/logo/DriveLogo';
import useDashboardPaymentFlow from '../../../../../../hooks/useDashboardPaymentFlow';
import { useSubscriptionModal } from '../../../../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../../../payments/subscription/constants';
import type { DashboardMoreInfoSection } from '../../../shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import {
    DashboardMoreInfoSectionTag,
    DashboardMoreInfoSections,
} from '../../../shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import editDocuments from './illustrations/edit-documents.svg';
import organizeMemories from './illustrations/organize-memories.svg';
import safeguard from './illustrations/safeguard.svg';
import shareFiles from './illustrations/share-files.svg';

interface Props {
    subscription: Subscription | undefined;
}

const MeetGetMoreSection = ({ subscription }: Props) => {
    const isFreeSubscription = hasFree(subscription);
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(APPS.PROTONDRIVE);

    const handleDrivePlusUpsell = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.DRIVE,
            telemetryFlow,
        });
    };

    const sections: DashboardMoreInfoSection[] = [
        {
            id: 'create-edit-confidance',
            title: () => c('Blog').t`Create and edit with confidence`,
            description: () => c('Blog').t`Write, edit and collaborate on documents securely with ${DOCS_APP_NAME}.`,
            image: editDocuments,
            link: 'https://proton.me/drive/docs',
            cardAction: 'external_link',
        },
        {
            id: 'photos-out-of-ai-training',
            title: () => c('Blog').t`Keep your photos out of AI training`,
            tag: isFreeSubscription ? (
                <DashboardMoreInfoSectionTag
                    key="organize-memories-drive-label"
                    prefix={<DriveLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.DRIVE]}
                />
            ) : undefined,
            description: () =>
                isFreeSubscription
                    ? c('Blog').t`Get enough storage for over 40,000 photos.`
                    : c('Blog').t`Backup, organize, and securely share a lifetime of memories.`,
            image: organizeMemories,
            onClick: isFreeSubscription ? () => handleDrivePlusUpsell() : undefined,
            cardAction: isFreeSubscription ? 'upsell_modal' : undefined,
        },
        {
            id: 'share-files-securely',
            title: () => c('Blog').t`Share files securely`,
            description: () => c('Blog').t`Send files via secure links or email, revoke access whenever needed.`,
            image: shareFiles,
            link: 'https://proton.me/drive/file-sharing',
            cardAction: 'external_link',
        },
        {
            id: 'safeguard-your-work',
            title: () => c('Blog').t`Safeguard your work`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="safeguard-family-label"
                    prefix={<DriveLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.DRIVE_BUSINESS]}
                />
            ),
            description: () =>
                c('Blog')
                    .t`Keep your team’s files protected, accessible, and in sync with ${DRIVE_APP_NAME} for Business.`,
            image: safeguard,
            link: 'https://proton.me/business/drive',
            cardAction: 'external_link',
        },
    ];

    return <DashboardMoreInfoSections sections={sections} app={APPS.PROTONMEET} />;
};

export default MeetGetMoreSection;
