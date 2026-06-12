import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Info from '@proton/components/components/link/Info';
import withPermissionGuard from '@proton/components/components/orgPermissions/withPermissionGuard';
import { SetupOrgSpotlight } from '@proton/components/containers/account/spotlights/passB2bOnboardingSpotlights/PassB2bOnboardingSpotlights';
import {
    getInvitationAcceptLimit,
    getInvitationLimit,
} from '@proton/components/containers/members/UsersAndAddressesSection/helper';
import type { UseUserMemberActions } from '@proton/components/containers/members/UsersAndAddressesSection/useMemberActions';
import type { APP_NAMES } from '@proton/shared/lib/constants';

const GuardedAddUserButton = withPermissionGuard('account.user.create')(Button);
const GuardedAddAddressButton = withPermissionGuard('account.user.update')(Button);

export const MembersTableHeader = ({
    app,
    searchInput,
    membersHook: { meta, actions },
}: {
    app: APP_NAMES;
    searchInput: ReactNode;
    membersHook: UseUserMemberActions;
}) => {
    const createUserButtonWithTooltip = (
        <GuardedAddUserButton color="norm" disabled={meta.disableAddUserButton} onClick={actions.handleAddUser}>
            {c('Action').t`Add user`}
        </GuardedAddUserButton>
    );
    return (
        <div className="mb-4 flex items-start">
            <div className="mb-2 w-full lg:w-custom" style={{ '--lg-w-custom': '24em' }}>
                {searchInput}
            </div>
            <div className="flex items-center mb-2 gap-2 ml-0 lg:ml-auto">
                {!meta.showAddAddress && meta.hasSetupActiveOrganizationWithKeys && (
                    <SetupOrgSpotlight app={app}>{createUserButtonWithTooltip}</SetupOrgSpotlight>
                )}
                {meta.showAddAddress && (
                    <>
                        {meta.isOrgAFamilyPlan ? (
                            <GuardedAddUserButton
                                color="norm"
                                disabled={meta.disableInviteUserButton}
                                onClick={actions.handleInviteUser}
                            >
                                {c('Action').t`Invite user`}
                            </GuardedAddUserButton>
                        ) : (
                            createUserButtonWithTooltip
                        )}

                        {/* Only family and visionary can invite existing Proton users */}
                        {meta.canInviteProtonUsers &&
                            (meta.hasReachedInvitationLimit ? (
                                <Info
                                    className="color-danger"
                                    title={meta.hasDuoPlan ? getInvitationLimit(3) : getInvitationLimit(10)}
                                />
                            ) : (
                                <Info
                                    title={meta.hasDuoPlan ? getInvitationAcceptLimit(3) : getInvitationAcceptLimit(10)}
                                />
                            ))}

                        {meta.hasMaxAddresses && (
                            <GuardedAddAddressButton
                                shape="outline"
                                disabled={meta.disableAddAddressButton}
                                onClick={() => actions.handleAddAddress()}
                            >
                                {c('Action').t`Add address`}
                            </GuardedAddAddressButton>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
