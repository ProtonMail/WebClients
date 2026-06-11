import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Info from '@proton/components/components/link/Info';
import { SetupOrgSpotlight } from '@proton/components/containers/account/spotlights/passB2bOnboardingSpotlights/PassB2bOnboardingSpotlights';
import {
    getInvitationAcceptLimit,
    getInvitationLimit,
} from '@proton/components/containers/members/UsersAndAddressesSection/helper';
import type { UseUserMemberActions } from '@proton/components/containers/members/UsersAndAddressesSection/useMemberActions';
import type { APP_NAMES } from '@proton/shared/lib/constants';

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
        <Tooltip title={!meta.canAddUser ? c('Label').t`You don't have permissions` : undefined} openDelay={100}>
            <span>
                <Button color="norm" disabled={meta.disableAddUserButton} onClick={actions.handleAddUser}>
                    {c('Action').t`Add user`}
                </Button>
            </span>
        </Tooltip>
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
                            <Tooltip
                                title={!meta.canAddUser ? c('Label').t`You don't have permissions` : undefined}
                                openDelay={100}
                            >
                                <span>
                                    <Button
                                        color="norm"
                                        disabled={meta.disableInviteUserButton}
                                        onClick={actions.handleInviteUser}
                                    >
                                        {c('Action').t`Invite user`}
                                    </Button>
                                </span>
                            </Tooltip>
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
                            <Tooltip
                                title={!meta.canUpdateUser ? c('Label').t`You don't have permissions` : undefined}
                                openDelay={100}
                            >
                                <span>
                                    <Button
                                        shape="outline"
                                        disabled={meta.disableAddAddressButton}
                                        onClick={() => actions.handleAddAddress()}
                                    >
                                        {c('Action').t`Add address`}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
