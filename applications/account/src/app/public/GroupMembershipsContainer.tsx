import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { GenericError, Prompt, useApi, useErrorHandler, useModalState } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getExternalGroupMemberships } from '@proton/shared/lib/api/groups';
import { acceptExternalGroupMembership, declineExternalGroupMembership } from '@proton/shared/lib/api/groups';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';

import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import ExpiredError from './ExpiredError';
import groupsIllustration from './user-groups.svg';

enum ErrorType {
    Expired,
    API,
}

interface GroupMembershipsReturn {
    Memberships: {
        ID: string;
        Email: string;
        State: number;
        Group: {
            ID: string;
            Name: string;
            Address: string;
        };
    }[];
    Total: number;
}

interface ConfirmLeavePromptProps {
    onConfirm: () => void;
}

const ConfirmLeavePrompt = ({ onClose, onConfirm, open, ...modalProps }: ConfirmLeavePromptProps & ModalStateProps) => {
    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={c('Title').t`Leave group?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onClose();
                        onConfirm();
                    }}
                >
                    {c('Action').t`Leave group`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            <p className="m-0">{c('Info')
                .t`Are you sure you want to leave this group? If you leave, you will need to be reinvited by the group administrator to join again.`}</p>
        </Prompt>
    );
};

const GroupMembershipsContainer = () => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading(true);
    const silentApi = getSilentApi(api);
    const location = useLocation();
    const [groupMemberships, setGroupMemberships] = useState<GroupMembershipsReturn | null>(null);
    const [confirmLeaveModalProps, setConfirmLeaveModal, renderConfirmLeaveModal] = useModalState();
    const [leaveGroupDetails, setLeaveGroupDetails] = useState<{
        leaveGroupID: string;
        leaveGroupMemberID: string;
    } | null>(null);

    const jwt = location.hash.replace('#', '');

    useEffect(() => {
        const promise = async () => {
            try {
                const groupMemberships: GroupMembershipsReturn = await silentApi(getExternalGroupMemberships(jwt));
                groupMemberships.Memberships.sort((a, b) => {
                    // Pending comes first, then sorted by name
                    if (a.State === GROUP_MEMBER_STATE.PENDING && b.State === GROUP_MEMBER_STATE.ACTIVE) {
                        return -1;
                    }
                    if (a.State === GROUP_MEMBER_STATE.ACTIVE && b.State === GROUP_MEMBER_STATE.PENDING) {
                        return 1;
                    }
                    return a.Group.Name.localeCompare(b.Group.Name);
                });
                setGroupMemberships(groupMemberships);
            } catch (error) {
                const { code } = getApiError(error);
                if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                    setError({ type: ErrorType.Expired });
                } else {
                    handleError(error);
                    setError({ type: ErrorType.API });
                }
            }
        };

        void withLoading(promise);
    }, []);

    if (error) {
        if (error.type === ErrorType.Expired) {
            return (
                <div className="absolute inset-center">
                    <ExpiredError type="group" />
                </div>
            );
        }

        return (
            <div className="absolute inset-center">
                <GenericError className="text-center">
                    {c('group_invite_2024: Error message, recovery').t`Please try opening the link again.`}
                </GenericError>
            </div>
        );
    }

    if (loading || groupMemberships === null) {
        return (
            <div className="absolute inset-center text-center">
                <CircleLoader size="large" />
            </div>
        );
    }

    if (groupMemberships.Memberships.length === 0) {
        const header = (
            <div className="flex flex-column items-center">
                <span>{c('group_invite_2024: Title').t`Group membership`}</span>
            </div>
        );

        return (
            <PublicLayout
                img={<img src={groupsIllustration} alt="" />}
                className="h-full"
                header={header}
                main={c('group_invite_2024').t`You have no groups to manage`}
                below={<PublicFooter />}
            />
        );
    }

    const email = groupMemberships.Memberships[0].Email;

    const header = (
        <div className="flex flex-column items-center">
            <span>{c('group_invite_2024: Title').t`Group membership`}</span>
            <span className="color-weak text-sm">{c('group_invite_2024: Title').jt`for ${email}`}</span>
        </div>
    );

    const handleSetState = async (GroupMemberID: string, GroupID: string, active: boolean) => {
        const groupMembership = groupMemberships.Memberships.find(
            ({ ID: membershipID }) => membershipID === GroupMemberID
        );
        if (!groupMembership) {
            return;
        }

        if (active) {
            await api(acceptExternalGroupMembership(jwt, GroupID));
        } else {
            await api(declineExternalGroupMembership(jwt, GroupID));
        }

        setGroupMemberships((prev) => {
            if (!prev) {
                return null;
            }

            if (active) {
                // set group to active
                return {
                    ...prev,
                    Memberships: prev.Memberships.map((membership) => {
                        if (membership.ID === GroupMemberID) {
                            return {
                                ...membership,
                                State: GROUP_MEMBER_STATE.ACTIVE,
                            };
                        }
                        return membership;
                    }),
                };
            }

            // remove group from array
            return {
                ...prev,
                Memberships: prev.Memberships.filter(({ ID: membershipID }) => membershipID !== GroupMemberID),
            };
        });
    };

    const main = (
        <ul className="unstyled relative w-full">
            {groupMemberships.Memberships.map(({ ID: GroupMemberID, Group: { ID: GroupID, Name, Address }, State }) => {
                const isActive = State === GROUP_MEMBER_STATE.ACTIVE;
                const isPending = State === GROUP_MEMBER_STATE.PENDING;

                return (
                    <li key={GroupMemberID} className="mb-4 flex items-center flex-nowrap gap-2 justify-space-between">
                        <div className="flex flex-column items-start">
                            <span className="mr-1">{Name}</span>
                            <span className="mr-1 text-sm color-weak">{Address}</span>
                        </div>
                        {isActive && (
                            <Button
                                onClick={() => {
                                    setLeaveGroupDetails({ leaveGroupID: GroupID, leaveGroupMemberID: GroupMemberID });
                                    setConfirmLeaveModal(true);
                                }}
                                color="weak"
                                size="small"
                            >
                                {c('Action').t`Leave`}
                            </Button>
                        )}
                        {isPending && (
                            <div>
                                <Button
                                    onClick={() => handleSetState(GroupMemberID, GroupID, false)}
                                    color="weak"
                                    size="small"
                                    className="mr-1"
                                >
                                    {c('Action').t`Decline`}
                                </Button>
                                <Button
                                    onClick={() => handleSetState(GroupMemberID, GroupID, true)}
                                    color="norm"
                                    size="small"
                                >
                                    {c('Action').t`Accept`}
                                </Button>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <>
            <PublicLayout
                img={<img src={groupsIllustration} alt="" />}
                className="h-full"
                header={header}
                main={main}
                below={<PublicFooter />}
            />
            {renderConfirmLeaveModal && (
                <ConfirmLeavePrompt
                    {...confirmLeaveModalProps}
                    onConfirm={() => {
                        if (!leaveGroupDetails) {
                            return;
                        }

                        handleSetState(leaveGroupDetails.leaveGroupMemberID, leaveGroupDetails.leaveGroupID, false);
                        setLeaveGroupDetails(null);
                    }}
                />
            )}
        </>
    );
};

export default () => (
    <main className="main-area h-full">
        <GroupMembershipsContainer />
    </main>
);
