import { useEffect } from 'react';

import { c } from 'ttag';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { groupOwnerInvitesThunk } from '@proton/account/groupOwnerInvites';
import { AdminRolesUIState, useAdminRolesUI } from '@proton/account/userPermissions/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Href } from '@proton/atoms/Href/Href';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { ROLE_SOURCE } from '@proton/shared/lib/interfaces/OrganizationRole';
import securityUpsellSvg from '@proton/styles/assets/img/illustrations/security-upsell.svg';
import noop from '@proton/utils/noop';

import SettingsPageTitle from '../../account/SettingsPageTitle';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import { PromotionBanner } from '../../banner/PromotionBanner';
import AdminRolesOnboardingModal from '../../members/rolesAndPermissions/AdminRolesOnboardingModal';
import RoleAssignmentPausedBanner from '../../members/rolesAndPermissions/RoleAssignmentPausedBanner';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import ScimSetupBannerAndModal from '../ScimSetupBannerAndModal';
import GroupsMemberManagementPanel from './components/GroupsMemberManagementPanel';
import { useGroupsManagement, withGroupsManagementContext } from './context/GroupsManagementContext';
import { GROUPS_RESTRICTION_REASON } from './types';

import './OrganizationGroupsManagementSection.scss';

interface Props {
    app?: APP_NAMES;
    upgradeRequired?: boolean;
}

const OrganizationGroupsManagementSection = ({ app, upgradeRequired }: Props) => {
    const [entitlements] = useEntitlementChecksForOrgAndUser();
    const { groups, actions, restrictedBy } = useGroupsManagement();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const dispatch = useDispatch();
    const [adminRolesUIState] = useAdminRolesUI();
    const {
        feature: adminRolesModalFeature,
        update: updateAdminRolesModal,
        loading: adminRolesModalLoading,
    } = useFeature(FeatureCode.AdminRolesGroupOnboardingModal, adminRolesUIState === AdminRolesUIState.Enabled);

    const canShowAdminRolesModal =
        adminRolesUIState === AdminRolesUIState.Enabled && !adminRolesModalLoading && !!adminRolesModalFeature?.Value;

    useEffect(() => {
        // The thunk checks the UserGroupsGroupOwner flag and the groups entitlement itself.
        dispatch(groupOwnerInvitesThunk()).catch(noop);
    }, []);

    // In the Pass admin panel, link to the Pass-specific groups article.
    const groupsKbUrl = getKnowledgeBaseUrl(app === APPS.PROTONPASS ? '/proton-pass-groups' : '/groups');

    if (upgradeRequired) {
        const kbUrl = groupsKbUrl;
        return (
            <SettingsSectionWide className="h-full groups-management">
                <SettingsPageTitle className="my-14">{c('Title').t`Groups`}</SettingsPageTitle>
                <PromotionBanner
                    rounded
                    mode="banner"
                    contentCentered={false}
                    icon={<img src={securityUpsellSvg} alt="" width={40} height={40} />}
                    description={
                        <div>
                            <b>{c('Info').t`Enable groups to streamline access control`}</b>
                            <div>
                                {c('Info')
                                    .t`With groups, you can implement the company security policies for access control and reduce the risk of accessing unauthorised data.`}{' '}
                                <Href href={kbUrl} title={c('Info').t`Learn more about groups`}>
                                    {c('Link').t`Learn more`}
                                </Href>
                            </div>
                        </div>
                    }
                    cta={
                        <Button
                            color="norm"
                            loading={loadingSubscriptionModal}
                            onClick={() => {
                                void openSubscriptionModal({
                                    step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                                });
                            }}
                        >
                            {c('Action').t`Upgrade`}
                        </Button>
                    }
                />
            </SettingsSectionWide>
        );
    }

    const showMailFeatures = entitlements.hasGroupMail;
    const mailDescription = c('Info')
        .t`With groups, you can quickly and easily send emails to all the people in a specified group.`;
    const genericDescription = c('Info')
        .t`With groups, you can implement the company security policies for access control and reduce the risk of accessing unauthorised data.`;

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsPageTitle className="mt-14 mb-4">{c('Title').t`Groups`}</SettingsPageTitle>
            <div className="mb-12">
                <SettingsParagraph className="flex flex-column flex-nowrap" learnMoreUrl={groupsKbUrl}>
                    {showMailFeatures ? mailDescription : genericDescription}
                </SettingsParagraph>
            </div>

            {restrictedBy.reason === GROUPS_RESTRICTION_REASON.PLAN_UNSUPPORTED ? (
                <Card
                    rounded
                    background
                    bordered={false}
                    className="max-w-custom mb-4"
                    style={{ '--max-w-custom': '43em' }}
                >
                    {c('Info')
                        .t`The groups feature is not supported on your current subscription. Previously created groups are disabled and can only be deleted.`}
                </Card>
            ) : (
                <ScimSetupBannerAndModal />
            )}

            <RoleAssignmentPausedBanner
                roleAssignmentSource={ROLE_SOURCE.GROUP}
                pausedCount={groups.filter((group) => group.requiresOrgKeyPromotion).length}
                isResuming={restrictedBy.reason === GROUPS_RESTRICTION_REASON.RESUMING_ROLE_ASSIGNMENT}
                onToggle={() => actions.onToggleRoleAssignments()}
            />
            <GroupsMemberManagementPanel />
            <AdminRolesOnboardingModal
                variant="group"
                open={canShowAdminRolesModal}
                onClose={() => {
                    void updateAdminRolesModal(false);
                }}
            />
        </SettingsSectionWide>
    );
};

export default withGroupsManagementContext(OrganizationGroupsManagementSection);
