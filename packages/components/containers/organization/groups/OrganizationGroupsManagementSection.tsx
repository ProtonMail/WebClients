import { useEffect } from 'react';

import { c } from 'ttag';

import { groupOwnerInvitesThunk } from '@proton/account/groupOwnerInvites';
import { useOrganization } from '@proton/account/organization/hooks';
import { Card } from '@proton/atoms/Card/Card';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import AdminRolesOnboardingModal from '@proton/components/containers/members/rolesAndPermissions/AdminRolesOnboardingModal';
import { FeatureCode, useFeature } from '@proton/features';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import GroupsMemberManagementPanel from './components/GroupsMemberManagementPanel';
import { useGroupsManagement, withGroupsManagementContext } from './context/GroupsManagementContext';
import useGroupAvailableAddressDomains from './hooks/useGroupAvailableAddressDomains';
import shouldShowMail from './shouldShowMail';

import './OrganizationGroupsManagementSection.scss';

const OrganizationGroupsManagementSection = () => {
    const [organization] = useOrganization();
    const { isFrozen } = useGroupsManagement();
    const isUserGroupsGroupOwnerEnabled = useFlag('UserGroupsGroupOwner');
    const dispatch = useDispatch();
    const hasAdminRoles = useFlag('AdminRoleMVP');
    const {
        feature: adminRolesModalFeature,
        update: updateAdminRolesModal,
        loading: adminRolesModalLoading,
    } = useFeature(FeatureCode.AdminRolesGroupOnboardingModal, hasAdminRoles);

    const canShowAdminRolesModal = !adminRolesModalLoading && !!adminRolesModalFeature?.Value;

    useEffect(() => {
        if (isUserGroupsGroupOwnerEnabled) {
            dispatch(groupOwnerInvitesThunk()).catch(noop);
        }
    }, []);

    const { hasUsableDomain, invalidGroupSuggestion } = useGroupAvailableAddressDomains();

    const linkToDomainPage = (
        <SettingsLink key="link-to-domain-page" path="/domain-names">{c('Action').t`Domain name`}</SettingsLink>
    );

    const showMailFeatures = shouldShowMail(organization?.PlanName);
    const mailDescription = c('Info')
        .t`With groups, you can quickly and easily send emails to all the people in a specified group.`;
    const genericDescription = c('Info')
        .t`With groups, you can implement the company security policies for access control and reduce the risk of accessing unauthorised data.`;

    return (
        <SettingsSectionWide className="h-full groups-management">
            <SettingsPageTitle className="mt-14">{c('Title').t`Groups`}</SettingsPageTitle>
            <SettingsParagraph className="flex flex-column flex-nowrap" learnMoreUrl={getKnowledgeBaseUrl('/groups')}>
                {showMailFeatures ? mailDescription : genericDescription}
            </SettingsParagraph>
            {!hasUsableDomain && (
                <SettingsParagraph>
                    {c('Info')
                        .jt`A custom domain is required to create groups. If you don't have a custom domain set up, do so first under ${linkToDomainPage}.`}
                </SettingsParagraph>
            )}
            {isFrozen && (
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
            )}
            {(hasUsableDomain || invalidGroupSuggestion) && <GroupsMemberManagementPanel />}
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
