import { useEffect, useMemo, useRef, useState } from 'react';

import { Form, FormikProvider } from 'formik';
import isEmpty from 'lodash/isEmpty';
import { c } from 'ttag';

import { Button, CircleLoader, Panel, PanelHeader } from '@proton/atoms';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { ADDRESS_TYPE, KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { EnhancedMember, Group } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';
import { GroupPermissions } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

import DiscardGroupChangesPrompt from './DiscardGroupChangesPrompt';
import E2EEDisabledWarning from './E2EEDisabledWarning';
import GroupAddressDomainSelect from './GroupAddressDomainSelect';
import GroupMemberList from './GroupMemberList';
import { NewGroupMemberInput } from './NewGroupMemberInput';
import { NewGroupMemberItem } from './NewGroupMemberItem';
import WillDisableE2eePrompt from './WillDisableE2eePrompt';
import E2EEToggle from './components/E2EEToggle';
import { getAddressSuggestedLocalPart } from './helpers';
import useTriggerDiscardModal from './hooks/useTriggerDiscardModal';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    groupData?: Group;
}

export interface NewGroupMember {
    Name: string;
    Address: string;
    GroupMemberType: GROUP_MEMBER_TYPE;
}

const getMemberAddressMap = (members: EnhancedMember[]) => {
    const addressMap: { [key: string]: string | null } = {};
    members?.forEach((member: EnhancedMember) => {
        if (member?.Addresses && member.Addresses.length > 0) {
            addressMap[member.Addresses[0].Email] = member.ID;
        }
    });
    return addressMap;
};

const getEmailIsExternalMap = (members: EnhancedMember[]): Record<string, boolean> => {
    return members.reduce<Record<string, boolean>>((acc, member) => {
        (member?.Addresses ?? []).forEach((address) => {
            acc[address.Email] = address.Type === ADDRESS_TYPE.TYPE_EXTERNAL;
        });
        return acc;
    }, {});
};

const EditGroup = ({ groupsManagement, groupData }: Props) => {
    const {
        uiState,
        actions,
        form,
        groupMembers,
        loadingGroupMembers,
        domainData,
        suggestedAddressDomainName,
        suggestedAddressDomainPart,
        selectedGroup,
        members,
        addressToMemberMap,
    } = groupsManagement;
    // Since we're editing a group (EditGroup component), it's implied that deletion isn't the only option
    // Thus, canOnlyDelete is always false in this context
    const canOnlyDelete = false;

    const { dirty, values: formValues, setFieldValue, isValid, errors } = form;
    const hasErrors = !isEmpty(errors);
    const { loadingCustomDomains, selectedDomain, setSelectedDomain, customDomains } = domainData;

    const [willDisableE2eeModalProps, setWillDisableE2eeModal, renderWillDisableE2eeModal] = useModalState();
    const [e2eeWillBeDisabled, setE2eeWillBeDisabled] = useState(false);
    const [discardChangesModalProps, setDiscardChangesModal, renderDiscardChangesModal] = useModalState();

    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [newGroupMembers, setNewGroupMembers] = useState<NewGroupMember[]>([]);
    const handleWillNotDisableE2ee = () => {
        setWillDisableE2eeModal(false);

        // remove external group members
        setNewGroupMembers((prev) => prev.filter((member) => member.GroupMemberType === GROUP_MEMBER_TYPE.INTERNAL));
    };
    const memberAddressMap = getMemberAddressMap(members);
    const emailIsExternalMap = getEmailIsExternalMap(members);
    const verifiedCustomDomains = customDomains?.filter(getIsDomainActive);
    const panelRef = useRef<HTMLElement>(null);

    const newEmailsToAdd = newGroupMembers.map((member) => member.Address);
    const sortedNewGroupMembers = useMemo(() => [...newGroupMembers].reverse(), [newGroupMembers]);

    const changeDetected = dirty || !!newGroupMembers.length;

    useTriggerDiscardModal(() => {
        if (changeDetected) {
            setDiscardChangesModal(true);
        }
    });

    useEffect(() => {
        if (uiState === 'edit') {
            const addressDomain = formValues.address.substring(formValues.address.indexOf('@') + 1);
            setSelectedDomain(addressDomain);
        } else if (uiState === 'new') {
            setSelectedDomain(suggestedAddressDomainPart);
        }
    }, [uiState]);

    const updatedGroup = groupsManagement.groups.find((group) => group.Address.ID === groupData?.Address.ID);
    const updatedGroupAddressKey = updatedGroup?.Address.Keys[0];
    const updatedGroupAddressFlags = updatedGroupAddressKey?.Flags ?? 0;

    useEffect(() => {
        const initialIsE2EEEnabled = !hasBit(updatedGroupAddressFlags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
        setE2eeWillBeDisabled(!initialIsE2EEEnabled);
    }, [updatedGroupAddressFlags]);

    const handleAddNewMembers = async (newMembers: NewGroupMember[]) => {
        const willDisableE2ee = newMembers.some((member) => member.GroupMemberType !== GROUP_MEMBER_TYPE.INTERNAL);
        if (willDisableE2ee && !e2eeWillBeDisabled) {
            setWillDisableE2eeModal(true);
        }
        setNewGroupMembers((prev) => [...prev, ...newMembers]);
    };

    const handleWillDisableE2ee = () => {
        setE2eeWillBeDisabled(true);
        setWillDisableE2eeModal(false);
    };

    const handleRemoveNewGroupMember = (memberToRemove: NewGroupMember) => {
        const updatedNewMembersList = newGroupMembers.filter((prev) => prev !== memberToRemove);
        setNewGroupMembers(updatedNewMembersList);
    };

    const handleAddAllOrganizationMembers = async () => {
        const exisitingEmails = new Set([
            ...groupMembers?.map((member) => member?.Email),
            ...newGroupMembers.map((newMember) => newMember.Address),
        ]);

        const newMembersToAdd = Object.keys(memberAddressMap)
            .filter((email) => !exisitingEmails.has(email))
            .map((email) => {
                const isExternal = emailIsExternalMap[email];
                const hasKeys = !!memberAddressMap[email];

                let GroupMemberType = GROUP_MEMBER_TYPE.INTERNAL;
                if (isExternal) {
                    GroupMemberType = hasKeys ? GROUP_MEMBER_TYPE.INTERNAL_TYPE_EXTERNAL : GROUP_MEMBER_TYPE.EXTERNAL;
                }

                return {
                    Name: email,
                    Address: email,
                    GroupMemberType,
                };
            });

        if (newMembersToAdd.length === 0) {
            createNotification({ text: c('Info').t`All members have been added.` });
            return;
        }

        const willDisableE2ee = newMembersToAdd.some((member) => member.GroupMemberType !== GROUP_MEMBER_TYPE.INTERNAL);
        if (willDisableE2ee && !e2eeWillBeDisabled) {
            setWillDisableE2eeModal(true);
        }
        setNewGroupMembers((prev) => [...prev, ...newMembersToAdd]);
    };

    return (
        <>
            <Panel
                ref={panelRef}
                header={
                    <PanelHeader
                        className="flex justify-space-between"
                        actions={(() => {
                            return [
                                <Button
                                    color="weak"
                                    key="button-cancel"
                                    onClick={() => {
                                        if (changeDetected) {
                                            setDiscardChangesModal(true);
                                        } else {
                                            actions.onDiscardChanges();
                                        }
                                    }}
                                >
                                    {c('Action').t`Cancel`}
                                </Button>,
                                <Button
                                    color="norm"
                                    key="button-save"
                                    disabled={!changeDetected || hasErrors}
                                    loading={loading}
                                    onClick={() => {
                                        if (isValid) {
                                            void withLoading(actions.onSaveGroup(newEmailsToAdd));
                                        }
                                    }}
                                >
                                    {c('Action').t`Save`}
                                </Button>,
                            ];
                        })()}
                    />
                }
            >
                <E2EEDisabledWarning
                    groupMembers={groupMembers}
                    loadingGroupMembers={loadingGroupMembers}
                    newGroupMembers={newGroupMembers}
                    group={groupData}
                    groupsManagement={groupsManagement}
                />
                <FormikProvider value={form}>
                    <Form id="groups" className="flex flex-column gap-4">
                        <InputFieldStackedGroup>
                            <InputFieldStacked isGroupElement icon="user">
                                <InputFieldTwo
                                    label={c('Label').t`Group name`}
                                    type="text"
                                    unstyled
                                    inputClassName="rounded-none"
                                    name="name"
                                    maxLength={30}
                                    placeholder={c('placeholder').t`Add a group name`}
                                    autoFocus={uiState === 'new' ? true : undefined}
                                    value={formValues.name}
                                    onValue={(name: string) => {
                                        setFieldValue('name', name);
                                    }}
                                    onBlur={() => {
                                        if (formValues.name !== '' && formValues.address === '') {
                                            const suggestedLocalPart = getAddressSuggestedLocalPart(formValues.name);
                                            setFieldValue('address', suggestedLocalPart);
                                        }
                                    }}
                                    error={errors.name}
                                />
                            </InputFieldStacked>
                            <InputFieldStacked isGroupElement icon="text-align-left">
                                <InputFieldTwo
                                    className="rounded-none p-0 resize-none"
                                    as={TextAreaTwo}
                                    label={c('Label').t`Purpose`}
                                    unstyled
                                    autoGrow
                                    name="description"
                                    placeholder={c('placeholder').t`e.g. distribution list for marketing team`}
                                    value={formValues.description}
                                    onValue={(description: string) => {
                                        setFieldValue('description', description);
                                    }}
                                />
                            </InputFieldStacked>
                        </InputFieldStackedGroup>
                        <InputFieldStackedGroup>
                            <InputFieldStacked isGroupElement icon="earth">
                                <InputFieldTwo
                                    label={c('Label').t`Group address`}
                                    unstyled
                                    className="rounded-none"
                                    name="address"
                                    placeholder={c('placeholder').t`e.g. marketing`}
                                    value={
                                        uiState === 'new'
                                            ? formValues.address
                                            : formValues.address.substring(0, formValues.address.indexOf('@'))
                                    }
                                    onValue={(address: string) => {
                                        setFieldValue('address', address);
                                    }}
                                    error={errors.address}
                                    disabled={uiState === 'edit'} // disable until BE supports address change
                                    suffix={(() => {
                                        if (loadingCustomDomains) {
                                            return <CircleLoader />;
                                        }

                                        return (
                                            <GroupAddressDomainSelect
                                                domains={verifiedCustomDomains}
                                                selectedDomain={selectedDomain}
                                                suggestedDomainName={suggestedAddressDomainName}
                                                onChange={(value: string) => setSelectedDomain(value)}
                                                setSelectedDomain={setSelectedDomain}
                                                disabled={uiState === 'edit'} // disable until BE supports address change
                                            />
                                        );
                                    })()}
                                />
                            </InputFieldStacked>
                            <InputFieldStacked isGroupElement icon="lock">
                                <InputFieldTwo
                                    label={c('Label').t`Who can send to this group address?`}
                                    as={SelectTwo}
                                    unstyled
                                    className="rounded-none"
                                    name="permissions"
                                    placeholder={c('placeholder').t`Members`}
                                    value={formValues.permissions}
                                    onValue={(permissions: any) => {
                                        setFieldValue('permissions', permissions);
                                    }}
                                >
                                    <Option title={c('option').t`Everyone`} value={GroupPermissions.EveryoneCanSend} />
                                    <Option title={c('option').t`No one`} value={GroupPermissions.NobodyCanSend} />
                                    <Option
                                        title={c('option').t`Group members`}
                                        value={GroupPermissions.GroupMembersCanSend}
                                    />
                                </InputFieldTwo>
                            </InputFieldStacked>
                        </InputFieldStackedGroup>
                    </Form>
                </FormikProvider>
                {uiState === 'edit' && groupData && (
                    <E2EEToggle group={groupData} groupsManagement={groupsManagement} />
                )}
                <NewGroupMemberInput
                    newGroupMembers={newGroupMembers}
                    onAddNewGroupMembers={handleAddNewMembers}
                    groupMembers={groupMembers}
                    onAddAllOrgMembers={handleAddAllOrganizationMembers}
                />
                <div className="mt-3 flex flex-column gap-3">
                    <div className="flex flex-column gap-3">
                        {sortedNewGroupMembers.map((member) => {
                            return (
                                <NewGroupMemberItem
                                    member={member}
                                    handleRemoveNewMember={handleRemoveNewGroupMember}
                                    submitting={loading}
                                    key={member.Address}
                                />
                            );
                        })}
                    </div>
                    <GroupMemberList
                        addressToMemberMap={addressToMemberMap}
                        groupMembers={groupMembers}
                        loading={loadingGroupMembers}
                        group={selectedGroup}
                        edit
                        canOnlyDelete={canOnlyDelete}
                    />
                </div>
            </Panel>
            {renderDiscardChangesModal && (
                <DiscardGroupChangesPrompt onConfirm={actions.onDiscardChanges} {...discardChangesModalProps} />
            )}
            {renderWillDisableE2eeModal && (
                <WillDisableE2eePrompt
                    onConfirm={handleWillDisableE2ee}
                    onCancel={handleWillNotDisableE2ee}
                    {...willDisableE2eeModalProps}
                />
            )}
        </>
    );
};

export default EditGroup;
