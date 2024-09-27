import { useEffect, useMemo, useRef, useState } from 'react';

import { Form, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button, CircleLoader, Panel, PanelHeader } from '@proton/atoms';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import type { Address, EnhancedMember, Group } from '@proton/shared/lib/interfaces';
import { GroupPermissions } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

import DiscardGroupChangesPrompt from './DiscardGroupChangesPrompt';
import GroupAddressDomainSelect from './GroupAddressDomainSelect';
import GroupMemberList from './GroupMemberList';
import { NewGroupMemberInput } from './NewGroupMemberInput';
import { NewGroupMemberItem } from './NewGroupMemberItem';
import E2EEToggle from './components/E2EEToggle';
import { getAddressSuggestedLocalPart } from './helpers';
import useTriggerDiscardModal from './hooks/useTriggerDiscardModal';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    groupData: Group;
}

export interface NewGroupMember {
    Name: string;
    Address: string;
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

const EditGroup = ({ groupsManagement, groupData }: Props) => {
    const {
        uiState,
        setUiState,
        handleSaveGroup,
        form,
        groupMembers,
        loadingGroupMembers,
        groups,
        domainData,
        suggestedAddressDomainName,
        suggestedAddressDomainPart,
        selectedGroup,
        members,
    } = groupsManagement;
    // Since we're editing a group (EditGroup component), it's implied that deletion isn't the only option
    // Thus, canOnlyDelete is always false in this context
    const canOnlyDelete = false;

    const { resetForm, dirty, values: formValues, setFieldValue, isValid, errors } = form;
    const { loadingCustomDomains, selectedDomain, setSelectedDomain, customDomains } = domainData;
    const [discardChangesModalProps, setDiscardChangesModal, renderDiscardChangesModal] = useModalState();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [newGroupMembers, setNewGroupMembers] = useState<NewGroupMember[]>([]);
    const memberAddressMap = getMemberAddressMap(members);
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

    const onDiscardChanges = () => {
        setUiState(groups.length === 0 ? 'empty' : 'view');
        resetForm({
            values: {
                name: groupData.Name,
                description: groupData.Description,
                address: groupData.Address.Email,
                permissions: groupData.Permissions ?? GroupPermissions.EveryoneCanSend,
                members: '',
            },
        });
    };

    const handleAddNewMembers = (newMembers: NewGroupMember[]) => {
        setNewGroupMembers((prev) => [...prev, ...newMembers]);
    };

    const handleRemoveNewGroupMember = (memberToRemove: NewGroupMember) => {
        const updatedNewMembersList = newGroupMembers.filter((prev) => prev !== memberToRemove);
        setNewGroupMembers(updatedNewMembersList);
    };

    const handleAddAllOrganizationMembers = () => {
        const exisitingEmails = new Set([
            ...groupMembers?.map((member) => member?.Email),
            ...newGroupMembers.map((newMember) => newMember.Address),
        ]);

        const newMembersToAdd = Object.keys(memberAddressMap)
            .filter((email) => !exisitingEmails.has(email))
            .map((email) => ({
                Name: email,
                Address: email,
            }));

        if (newMembersToAdd.length === 0) {
            createNotification({ text: c('Info').t`All members have been added.` });
            return;
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
                                            onDiscardChanges();
                                        }
                                    }}
                                >
                                    {c('Action').t`Cancel`}
                                </Button>,
                                <Button
                                    color="norm"
                                    key="button-save"
                                    disabled={!changeDetected}
                                    loading={loading}
                                    onClick={() => {
                                        if (isValid) {
                                            void withLoading(handleSaveGroup(newEmailsToAdd));
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
                {uiState === 'edit' && <E2EEToggle address={groupData.Address as Address} />}
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
                        groupMembers={groupMembers}
                        loading={loadingGroupMembers}
                        group={selectedGroup}
                        edit
                        canOnlyDelete={canOnlyDelete}
                    />
                </div>
            </Panel>
            {renderDiscardChangesModal && (
                <DiscardGroupChangesPrompt onConfirm={onDiscardChanges} {...discardChangesModalProps} />
            )}
        </>
    );
};

export default EditGroup;
