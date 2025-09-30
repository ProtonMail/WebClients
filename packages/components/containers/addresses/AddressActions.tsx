import { c } from 'ttag';

import { disableAllowAddressDeletion } from '@proton/account';
import { deleteAddress, disableAddress, enableAddress } from '@proton/account/addresses/actions';
import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import DisconnectBYOEModal from '@proton/activation/src/components/Modals/DisconnectBYOEModal/DisconnectBYOEModal';
import ReachedLimitForwardingModal from '@proton/activation/src/components/Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal';
import UpsellForwardingModal from '@proton/activation/src/components/Modals/UpsellForwardingModal/UpsellForwardingModal';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import useReconnectSync from '@proton/activation/src/hooks/useReconnectSync';
import type { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useErrorWrapper } from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import type { WithLoading } from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import type { Address, Member, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import EditExternalAddressModal from '../../containers/account/EditExternalAddressModal';
import EditInternalAddressModal from '../../containers/addresses/EditInternalAddressModal';
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

const useAddressFlagsActionsList = (
    address: Address,
    user: UserModel,
    member: Member | undefined,
    withLoading: WithLoading
) => {
    const addressFlags = useAddressFlags(address);

    const isPaidMail = user.hasPaidMail;
    // Only allow on the user's own settings address list, not in org admin management panel.
    // This still allows an admin logged in as sub-user to manage the preferences.
    const isSelf = member === undefined || !!member.Self;
    if (!addressFlags || !isPaidMail || !isSelf) {
        return [];
    }

    const { data, handleSetAddressFlags } = addressFlags;
    const { permissions, isEncryptionDisabled, isExpectSignatureDisabled } = data;

    const handleSetAddressFlagsWithLoading = (settings: Parameters<typeof handleSetAddressFlags>[0]) => () =>
        withLoading(handleSetAddressFlags(settings));

    const config: Record<keyof typeof permissions, DropdownActionProps> = {
        allowDisablingEncryption: {
            // translator: this is in a small space, so the string should be short, max 25 characters
            text: c('Address action').t`Disable E2EE mail`,
            key: 'address-flag-action-disable-e2ee-mail',
            onClick: handleSetAddressFlagsWithLoading({
                encryptionDisabled: true,
                expectSignatureDisabled: isExpectSignatureDisabled,
            }),
        },
        allowEnablingEncryption: {
            // translator: this is in a small space, so the string should be short, max 25 characters
            text: c('Address action').t`Enable E2EE mail`,
            key: 'address-flag-action-enable-e2ee-mail',
            onClick: handleSetAddressFlagsWithLoading({
                encryptionDisabled: false,
                expectSignatureDisabled: isEncryptionDisabled,
            }),
        },
        allowDisablingUnsignedMail: {
            // translator: this is in a small space, so the string should be short, max 25 characters
            text: c('Address action').t`Disallow unsigned mail`,
            key: 'address-flag-action-disallow-unsigned-mail',
            onClick: handleSetAddressFlagsWithLoading({
                encryptionDisabled: isEncryptionDisabled,
                expectSignatureDisabled: false,
            }),
        },
        allowEnablingUnsignedMail: {
            // translator: this is in a small space, so the string should be short, max 25 characters
            text: c('Address action').t`Allow unsigned mail`,
            key: 'address-flag-action-allow-unsigned-mail',
            onClick: handleSetAddressFlagsWithLoading({
                encryptionDisabled: isEncryptionDisabled,
                expectSignatureDisabled: true,
            }),
        },
    };

    return (
        Object.entries(permissions)
            // filter out the actions that are not enabled
            .filter(([, enabled]) => enabled)
            .map(([key]) => config[key as keyof typeof permissions])
    );
};

// This is a placeholder to avoid height loss when dropdownActions are not rendered
// TODO: find a style only solution for this
const Placeholder = () => <div style={{ height: '24px' }} />;

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
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const addressFlagsActionsList = useAddressFlagsActionsList(address, user, member, withLoading);
    const dispatch = useDispatch();
    const [organizationKey] = useOrganizationKey();
    const emailAddress = address.Email;
    const wrapError = useErrorWrapper();
    const hasAccessToBYOE = useBYOEFeatureStatus();
    const { sync, handleGrantPermission, handleReconnect, loadingConfig } = useReconnectSync(address);

    const [missingKeysProps, setMissingKeysAddressModalOpen, renderMissingKeysModal] = useModalState();
    const [deleteAddressPromptProps, setDeleteAddressPromptOpen, renderDeleteAddressPrompt] = useModalState();
    const [deleteAddressModalProps, setDeleteAddressModalOpen, renderDeleteAddressModal] = useModalState();
    const [disableAddressProps, setDisableAddressModalOpen, renderDisableAddress] = useModalState();
    const [editInternalAddressProps, setEditInternalAddressOpen, renderEditInternalAddressModal] = useModalState();
    const [editExternalAddressProps, setEditExternalAddressOpen, renderEditExternalAddressModal] = useModalState();
    const [disconnectBYOEProps, setDisconnectBYOEOpen, renderDisconnectBYOEModal] = useModalState();
    const [reachedLimitForwardingModalProps, setReachedLimitForwardingModalOpen, renderReachedLimitForwardingModal] =
        useModalState();
    const [upsellForwardingModalProps, setUpsellForwardingModalOpen, renderUpsellForwardingModal] = useModalState();

    const handleDelete = wrapError(async () => {
        await dispatch(deleteAddress({ address, member }));
        createNotification({ text: c('Success notification').t`Address deleted` });
    });

    const handleDeleteOncePerYear = wrapError(async () => {
        await handleDelete();
        dispatch(disableAllowAddressDeletion());
    });

    const handleEnable = wrapError(async () => {
        await dispatch(enableAddress({ address, member }));
        createNotification({ text: c('Success notification').t`Address enabled` });
    });

    const handleDisable = wrapError(async () => {
        await dispatch(disableAddress({ address, member }));
        createNotification({ text: c('Success notification').t`Address disabled` });
    });

    const mustActivateOrganizationKey = member?.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey;
    const generalActions: DropdownActionProps[] = [
        permissions.canGenerate && {
            text: c('Address action').t`Generate missing keys`,
            key: 'address-action-generate-missing-key',
            onClick: () => setMissingKeysAddressModalOpen(true),
            'aria-label': c('Address action').t`Generate missing keys for address “${emailAddress}”`,
        },
        permissions.canEditInternalAddress && {
            text: c('Address action').t`Edit`,
            key: 'address-action-edit',
            onClick: () => setEditInternalAddressOpen(true),
            'aria-label': c('Address action').t`Edit address “${emailAddress}”`,
        },
        permissions.canEditExternalAddress && {
            text: c('Address action').t`Edit address`,
            key: 'address-action-edit-address',
            onClick: () => setEditExternalAddressOpen(true),
        },
        permissions.canMakeDefault &&
            onSetDefault && {
                text: c('Address action').t`Set as default`,
                key: 'address-action-set-as-default',
                onClick: () => onSetDefault(),
                'aria-label': c('Address action').t`Set “${emailAddress}” as default address`,
            },
        permissions.canEnable && {
            text: c('Address action').t`Enable`,
            key: 'address-action-enable-address',
            onClick: () => withLoading(handleEnable()),
            'aria-label': c('Address action').t`Enable address “${emailAddress}”`,
        },
        permissions.canDisable && {
            text: c('Address action').t`Disable`,
            key: 'address-action-disable-address',
            onClick: () => setDisableAddressModalOpen(true),
            'aria-label': c('Address action').t`Disable address “${emailAddress}”`,
        },
        permissions.canDeleteAddress &&
            ({
                text: c('Address action').t`Delete address`,
                key: 'address-action-delete-address',
                actionType: 'delete',
                onClick: () => setDeleteAddressModalOpen(true),
                'aria-label': c('Address action').t`Delete address “${emailAddress}”`,
            } as const),
        permissions.canDeleteAddressOncePerYear &&
            !mustActivateOrganizationKey &&
            ({
                text: c('Address action').t`Delete address`,
                key: 'address-action-enable-address-once-per-year',
                actionType: 'delete',
                'aria-label': c('Address action').t`Delete address “${emailAddress}”`,
                onClick: () => setDeleteAddressPromptOpen(true),
                tooltip: allowAddressDeletion
                    ? c('Delete address tooltip').t`You can only delete 1 address per year`
                    : c('Delete address tooltip').t`You've reached the limit of address deletions for this user.`,
                disabled: !allowAddressDeletion,
            } as const),
        permissions.canGrantBYOEPermissions &&
        sync &&
        sync.state !== ApiSyncState.ACTIVE && {
            text: c('Address action').t`Grant permission`,
            key: 'address-action-grant-byoe-permission',
            onClick: () => handleGrantPermission(withLoading),
            disabled: loadingConfig,
            'aria-label': c('Address action').t`Grant permission to “${emailAddress}”`,
        },
        permissions.canReconnectBYOE && {
            text: c('Address action').t`Reconnect`,
            key: 'address-action-reconnect-byoe',
            onClick: () => handleReconnect({
                withLoading,
                address,
                setLimitModalOpen: setReachedLimitForwardingModalOpen,
                setUpsellModalOpen: setUpsellForwardingModalOpen,
            }),
            disabled: loadingConfig,
            'aria-label': c('Address action').t`Reconnect address “${emailAddress}”`,
        },
        permissions.canDisconnectBYOE && {
            text: c('Address action').t`Disconnect`,
            key: 'address-action-disconnect-byoe',
            onClick: () => setDisconnectBYOEOpen(true),
            disabled: loadingConfig,
            'aria-label': c('Address action').t`Disconnect address “${emailAddress}”`,
        },
    ].filter(isTruthy);

    // check if saving mode is active and if the current address is being used
    const list = (function getActionList() {
        if (savingIndex !== undefined) {
            return savingIndex === addressIndex ? [{ text: c('Address action').t`Saving` }] : [];
        }
        // if not in saving mode, show all the available actions
        return generalActions.concat(addressFlagsActionsList);
    })();

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
            {renderDisconnectBYOEModal && <DisconnectBYOEModal address={address} {...disconnectBYOEProps} />}
            {renderReachedLimitForwardingModal && <ReachedLimitForwardingModal {...reachedLimitForwardingModalProps} />}
            {renderUpsellForwardingModal && (
                <UpsellForwardingModal hasAccessToBYOE={hasAccessToBYOE} modalProps={upsellForwardingModalProps} />
            )}

            {list.length ? (
                <DropdownActions size="small" list={list} loading={loading || savingIndex !== undefined} />
            ) : (
                <Placeholder />
            )}
        </>
    );
};

export default AddressActions;
