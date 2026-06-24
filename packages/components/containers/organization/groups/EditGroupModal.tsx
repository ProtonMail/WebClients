import type { KeyboardEvent } from 'react';
import { useEffect } from 'react';

import { Form, FormikProvider } from 'formik';
import isEmpty from 'lodash/isEmpty';
import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useOrganizationRoles } from '@proton/account/organizationRoles/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import ModalHeaderWithTabs from '@proton/components/containers/members/rolesAndPermissions/ModalHeaderWithTabs';
import RolesAndPermissionsTab from '@proton/components/containers/members/rolesAndPermissions/RolesAndPermissionsTab';
import { useLoading } from '@proton/hooks';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { stripWhitespace } from '@proton/shared/lib/helpers/string';
import { GroupPermissions } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import DiscardGroupChangesPrompt from './DiscardGroupChangesPrompt';
import E2EEDisabledWarning from './E2EEDisabledWarning';
import GroupAddressDomainSelect from './GroupAddressDomainSelect';
import E2EEToggle from './components/E2EEToggle';
import { useGroupsManagement } from './context/GroupsManagementContext';
import { getAddressSuggestedLocalPart } from './helpers';
import useGroupAvailableAddressDomains from './hooks/useGroupAvailableAddressDomains';
import useTriggerDiscardModal from './hooks/useTriggerDiscardModal';
import shouldShowMail from './shouldShowMail';
import { GROUPS_STATE } from './types';

const EditGroupModal = () => {
    const {
        uiState,
        selectedGroup: groupData,
        actions,
        form,
        groupMembers,
        loadingGroupMembers,
        domainData,
    } = useGroupsManagement();

    const { dirty, values: formValues, setFieldValue, isValid, errors } = form;
    const hasErrors = !isEmpty(errors);
    const { primarySuggestion } = useGroupAvailableAddressDomains();

    const [discardChangesModalProps, setDiscardChangesModal, renderDiscardChangesModal] = useModalState();

    const [loading, withLoading] = useLoading();
    const [organization] = useOrganization();

    const [organizationRoles, loadingRoles] = useOrganizationRoles();
    const groupAssignableRoles = organizationRoles?.filter((role) => !isOwnerRole(role));
    const showRolesTab = useFlag('AdminRoleMVP');

    const onCancel = () => {
        if (dirty) {
            setDiscardChangesModal(true);
        } else {
            actions.onDiscardChanges();
        }
    };
    const onSave = () => {
        if (isValid) {
            void withLoading(actions.onSaveGroup());
        }
    };

    useTriggerDiscardModal(() => {
        if (dirty) {
            setDiscardChangesModal(true);
        }
    });

    useEffect(() => {
        if (uiState === GROUPS_STATE.EDIT) {
            const addressDomain = formValues.address.substring(formValues.address.indexOf('@') + 1);
            domainData.setSelectedDomain(addressDomain);
        } else if (uiState === GROUPS_STATE.NEW) {
            domainData.setSelectedDomain(primarySuggestion.domain ?? '');
        }
    }, [uiState, primarySuggestion.domain]);

    const hideMail = !shouldShowMail(organization?.PlanName);
    const primaryGroupAddressKey = groupData?.Address.Keys[0];
    const isE2EEEnabled = !hasBit(primaryGroupAddressKey?.Flags ?? 0, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    useEffect(() => {
        if (hideMail && uiState === GROUPS_STATE.NEW) {
            const suggestedLocalPart = getAddressSuggestedLocalPart(formValues.name, organization?.Name, hideMail);
            void setFieldValue('address', suggestedLocalPart, false);
        }
    }, [formValues.name]);

    const formContent = (
        <>
            {!hideMail && !isE2EEEnabled && (
                <div className="mb-2">
                    <E2EEDisabledWarning groupMembers={groupMembers} loadingGroupMembers={loadingGroupMembers} />
                </div>
            )}
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
                                autoFocus={uiState === GROUPS_STATE.NEW ? true : undefined}
                                value={formValues.name}
                                onValue={(name: string) => setFieldValue('name', name)}
                                onBlur={() => {
                                    const hasName = formValues.name !== '';
                                    const hasAddress = formValues.address !== '';
                                    if (hasName && !hasAddress) {
                                        const suggestedLocalPart = getAddressSuggestedLocalPart(formValues.name);
                                        void setFieldValue('address', suggestedLocalPart);
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
                                placeholder={
                                    hideMail ? undefined : c('placeholder').t`e.g. distribution list for marketing team`
                                }
                                value={formValues.description}
                                onValue={(description: string) => setFieldValue('description', description)}
                            />
                        </InputFieldStacked>
                    </InputFieldStackedGroup>
                    {!hideMail && (
                        <InputFieldStackedGroup>
                            <InputFieldStacked isGroupElement icon="earth">
                                <InputFieldTwo
                                    label={c('Label').t`Group address`}
                                    unstyled
                                    inputClassName="rounded-none"
                                    name="address"
                                    placeholder={c('placeholder').t`e.g. marketing`}
                                    value={
                                        uiState === GROUPS_STATE.NEW
                                            ? formValues.address
                                            : formValues.address.substring(0, formValues.address.indexOf('@'))
                                    }
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === ' ') {
                                            event.preventDefault();
                                        }
                                    }}
                                    onValue={(address: string) => setFieldValue('address', stripWhitespace(address))}
                                    error={errors.address}
                                    disabled={uiState === GROUPS_STATE.EDIT} // disable until BE supports address change
                                    suffix={(() => {
                                        if (domainData.loading) {
                                            return <CircleLoader />;
                                        }

                                        return (
                                            <GroupAddressDomainSelect
                                                selectedDomain={domainData.selectedDomain}
                                                onChange={(value: string) => domainData.setSelectedDomain(value)}
                                                setSelectedDomain={domainData.setSelectedDomain}
                                                disabled={uiState === GROUPS_STATE.EDIT} // disable until BE supports address change
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
                                    onValue={(permissions: any) => setFieldValue('permissions', permissions)}
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
                    )}
                </Form>
            </FormikProvider>
            {!hideMail && uiState === GROUPS_STATE.EDIT && groupData && <E2EEToggle group={groupData} />}
        </>
    );

    const modalTitle = uiState === GROUPS_STATE.NEW ? c('Title').t`Create group` : c('Title').t`Edit group`;

    return (
        <>
            <ModalTwo size="large" open onClose={onCancel}>
                <ModalHeaderWithTabs
                    title={modalTitle}
                    tabs={[
                        { title: c('group_modal').t`General`, content: formContent },
                        ...(showRolesTab
                            ? [
                                  {
                                      title: c('group_modal').t`Roles and permissions`,
                                      content: (
                                          <RolesAndPermissionsTab
                                              selectedRoles={new Set(formValues.adminRoles)}
                                              onChange={(roles) => setFieldValue('adminRoles', Array.from(roles))}
                                              organizationRoles={groupAssignableRoles}
                                              loadingRoles={loadingRoles}
                                              isGroupContext
                                          />
                                      ),
                                  },
                              ]
                            : []),
                    ]}
                />
                <ModalTwoFooter>
                    <Button color="weak" onClick={onCancel}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button color="norm" disabled={!dirty || hasErrors} loading={loading} onClick={onSave}>
                        {c('Action').t`Save`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
            {renderDiscardChangesModal && (
                <DiscardGroupChangesPrompt onConfirm={actions.onDiscardChanges} {...discardChangesModalProps} />
            )}
        </>
    );
};

export default EditGroupModal;
