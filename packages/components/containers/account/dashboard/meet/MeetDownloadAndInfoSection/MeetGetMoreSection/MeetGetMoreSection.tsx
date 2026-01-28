import { c } from 'ttag';

import DriveLogo from '@proton/components/components/logo/DriveLogo';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import type { Subscription } from '@proton/payments';
import { PLANS, PLAN_NAMES, hasFree } from '@proton/payments';
import { APPS, DOCS_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

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
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.DRIVE,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const sections: DashboardMoreInfoSection[] = [
        {
            title: () => c('Blog').t`Create and edit with confidence`,
            description: () => c('Blog').t`Write, edit and collaborate on documents securely with ${DOCS_APP_NAME}.`,
            image: editDocuments,
            link: 'https://proton.me/drive/docs',
        },
        {
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
        },
        {
            title: () => c('Blog').t`Share files securely`,
            description: () => c('Blog').t`Send files via secure links or email, revoke access whenever needed.`,
            image: shareFiles,
            link: 'https://proton.me/drive/file-sharing',
        },
        {
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
        },
    ];

    return <DashboardMoreInfoSections sections={sections} />;
};

export default MeetGetMoreSection;
