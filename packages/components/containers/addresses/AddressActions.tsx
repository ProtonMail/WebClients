import { c } from 'ttag';

import { disableAllowAddressDeletion } from '@proton/account';
import { useApi } from '@proton/components';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { deleteAddress, disableAddress, enableAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_STATUS, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import type { Address, Member, UserModel } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import EditExternalAddressModal from '../../containers/account/EditExternalAddressModal';
import EditInternalAddressModal from '../../containers/addresses/EditInternalAddressModal';
import { useEventManager, useNotifications, useOrganizationKey } from '../../hooks';
import useAddressFlags from '../../hooks/useAddressFlags';
import DeleteAddressPrompt from './DeleteAddressPrompt';
import DisableAddressModal from './DisableAddressModal';
import type { AddressPermissions } from './helper';
import CreateMissingKeysAddressModal from './missingKeys/CreateMissingKeysAddressModal';

interface Props {
    address: Address;
    member?: Member; // undefined if self
    user: UserModel;
    onSetDefault?: () => Promise<unknown>;
    savingIndex?: number;
    addressIndex?: number;
    permissions: AddressPermissions;
    allowAddressDeletion: boolean;
}

const useAddressFlagsActionsList = (address: Address, user: UserModel, member: Member | undefined) => {
    const addressFlags = useAddressFlags(address);
    const isPaidMail = user.hasPaidMail;
    // Only allow on the user's own settings address list, not in org admin management panel.
    // This still allows an admin logged in as sub-user to manage the preferences.
    const isSelf = member === undefined || !!member.Self;
    if (!addressFlags || !isPaidMail || !isSelf) {
        return [];
    }

    const { allowDisablingEncryption, encryptionDisabled, expectSignatureDisabled, handleSetAddressFlags } =
        addressFlags;

    const actions = [];

    if (!encryptionDisabled && allowDisablingEncryption) {
        actions.push({
            // translator: this is in a small space, so the string should be short, max 25 characters
            text: c('Address action').t`Disable E2EE mail`,
            onClick: () => handleSetAddressFlags(true, expectSignatureDisabled),
        });
    }

    if (encryptionDisabled) {
        actions.push({
            // translator: this is in a small space, so the string should be short, max 25 characters
            text: c('Address action').t`Enable E2EE mail`,
            onClick: () => handleSetAddressFlags(false, expectSignatureDisabled),
        });
    }

    if (expectSignatureDisabled) {
        actions.push({
            // translator: this is in a small space, so the string should be short, max 25 characters
            text: c('Address action').t`Disallow unsigned mail`,
            onClick: () => handleSetAddressFlags(encryptionDisabled, false),
        });
    }

    return actions;
};

const AddressActions = ({
    address,
    member,
    user,
    onSetDefault,
    savingIndex,
    addressIndex,
    permissions,
    allowAddressDeletion,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const addressFlagsActionsList = useAddressFlagsActionsList(address, user, member);
    const dispatch = useDispatch();
    const [organizationKey] = useOrganizationKey();

    const [missingKeysProps, setMissingKeysAddressModalOpen, renderMissingKeysModal] = useModalState();
    const [deleteAddressPromptProps, setDeleteAddressPromptOpen, renderDeleteAddressPrompt] = useModalState();
    const [deleteAddressModalProps, setDeleteAddressModalOpen, renderDeleteAddressModal] = useModalState();
    const [disableAddressProps, setDisableAddressModalOpen, renderDisableAddress] = useModalState();
    const [editInternalAddressProps, setEditInternalAddressOpen, renderEditInternalAddressModal] = useModalState();
    const [editExternalAddressProps, setEditExternalAddressOpen, renderEditExternalAddressModal] = useModalState();

    const handleDelete = async () => {
        if (address.Status === ADDRESS_STATUS.STATUS_ENABLED) {
            await api(disableAddress(address.ID));
        }
        await api(deleteAddress(address.ID));
        await call();
        createNotification({ text: c('Success notification').t`Address deleted` });
    };

    const handleDeleteOncePerYear = async () => {
        await handleDelete();
        dispatch(disableAllowAddressDeletion());
    };

    const handleEnable = async () => {
        await api(enableAddress(address.ID));
        await call();
        createNotification({ text: c('Success notification').t`Address enabled` });
    };

    const handleDisable = async () => {
        await api(disableAddress(address.ID));
        await call();
        createNotification({ text: c('Success notification').t`Address disabled` });
    };

    const addressDeletionEnabled = useFlag('AddressDeletion');
    const mustActivateOrganizationKey = member?.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey;

    const list =
        savingIndex !== undefined
            ? [savingIndex === addressIndex ? { text: c('Address action').t`Saving` } : null].filter(isTruthy)
            : [
                  permissions.canGenerate && {
                      text: c('Address action').t`Generate missing keys`,
                      onClick: () => setMissingKeysAddressModalOpen(true),
                  },
                  permissions.canEditInternalAddress && {
                      text: c('Address action').t`Edit`,
                      onClick: () => setEditInternalAddressOpen(true),
                  },
                  permissions.canEditExternalAddress && {
                      text: c('Address action').t`Edit address`,
                      onClick: () => setEditExternalAddressOpen(true),
                  },
                  permissions.canMakeDefault &&
                      onSetDefault && {
                          text: c('Address action').t`Set as default`,
                          onClick: () => onSetDefault(),
                      },
                  permissions.canEnable && {
                      text: c('Address action').t`Enable`,
                      onClick: () => withLoading(handleEnable()),
                  },
                  permissions.canDisable && {
                      text: c('Address action').t`Disable`,
                      onClick: () => setDisableAddressModalOpen(true),
                  },
                  permissions.canDeleteAddress &&
                      ({
                          text: c('Address action').t`Delete address`,
                          actionType: 'delete',
                          onClick: () => setDeleteAddressModalOpen(true),
                      } as const),
                  addressDeletionEnabled &&
                      permissions.canDeleteAddressOncePerYear &&
                      !mustActivateOrganizationKey &&
                      ({
                          text: c('Address action').t`Delete address`,
                          actionType: 'delete',
                          onClick: () => setDeleteAddressPromptOpen(true),
                          tooltip: allowAddressDeletion
                              ? c('Delete address tooltip').t`You can only delete 1 address per year`
                              : c('Delete address tooltip')
                                    .t`You've reached the limit of address deletions for this user.`,
                          disabled: !allowAddressDeletion,
                      } as const),
                  ...addressFlagsActionsList,
              ].filter(isTruthy);

    return (
        <>
            {renderMissingKeysModal && (
                <CreateMissingKeysAddressModal {...missingKeysProps} member={member} addressesToGenerate={[address]} />
            )}
            {renderEditInternalAddressModal && (
                <EditInternalAddressModal address={address} {...editInternalAddressProps} />
            )}
            {renderEditExternalAddressModal && (
                <EditExternalAddressModal address={address} {...editExternalAddressProps} />
            )}
            {renderDeleteAddressPrompt && (
                <DeleteAddressPrompt
                    onDeleteAddress={handleDeleteOncePerYear}
                    {...deleteAddressPromptProps}
                    email={address.Email}
                    type="permanent"
                />
            )}
            {renderDeleteAddressModal && (
                <DeleteAddressPrompt
                    onDeleteAddress={handleDelete}
                    {...deleteAddressModalProps}
                    email={address.Email}
                />
            )}
            {renderDisableAddress && (
                <DisableAddressModal email={address.Email} onDisable={handleDisable} {...disableAddressProps} />
            )}

            {list.length ? (
                <DropdownActions size="small" list={list} loading={loading || savingIndex !== undefined} />
            ) : (
                <div
                    // This is a placeholder to avoid height loss when dropdownActions are not rendered
                    style={{ height: '24px' }}
                />
            )}
        </>
    );
};

export default AddressActions;
