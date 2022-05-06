import { c } from 'ttag';

import { deleteAddress, disableAddress, enableAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { Address, CachedOrganizationKey, Member } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions, useModalState } from '../../components';
import { useApi, useEventManager, useLoading, useNotifications } from '../../hooks';
import DeleteAddressModal from './DeleteAddressModal';
import DisableAddressModal from './DisableAddressModal';
import { AddressPermissions } from './helper';
import CreateMissingKeysAddressModal from './missingKeys/CreateMissingKeysAddressModal';

interface Props {
    address: Address;
    member?: Member; // undefined if self
    organizationKey?: CachedOrganizationKey;
    onSetDefault?: () => Promise<unknown>;
    savingIndex?: number;
    addressIndex?: number;
    permissions: AddressPermissions;
}

const AddressActions = ({
    address,
    member,
    organizationKey,
    onSetDefault,
    savingIndex,
    addressIndex,
    permissions,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const [missingKeysProps, setMissingKeysAddressModalOpen, renderMissingKeysModal] = useModalState();
    const [deleteAddressProps, setDeleteAddressModalOpen, renderDeleteAddress] = useModalState();
    const [disableAddressProps, setDisableAddressModalOpen, renderDisableAddress] = useModalState();

    const handleDelete = async () => {
        if (address.Status === ADDRESS_STATUS.STATUS_ENABLED) {
            await api(disableAddress(address.ID));
        }
        await api(deleteAddress(address.ID));
        await call();
        createNotification({ text: c('Success notification').t`Address deleted` });
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

    const list =
        savingIndex !== undefined
            ? [savingIndex === addressIndex ? { text: c('Address action').t`Saving` } : null].filter(isTruthy)
            : [
                  permissions.canGenerate && {
                      text: c('Address action').t`Generate missing keys`,
                      onClick: () => setMissingKeysAddressModalOpen(true),
                  },
                  permissions.canMakeDefault &&
                      onSetDefault && {
                          text: c('Address action').t`Make default`,
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
                  permissions.canDelete &&
                      ({
                          text: c('Address action').t`Delete`,
                          actionType: 'delete',
                          onClick: () => setDeleteAddressModalOpen(true),
                      } as const),
              ].filter(isTruthy);

    return (
        <>
            {renderMissingKeysModal && (
                <CreateMissingKeysAddressModal
                    {...missingKeysProps}
                    member={member}
                    addressesToGenerate={[address]}
                    organizationKey={organizationKey}
                />
            )}
            {renderDeleteAddress && (
                <DeleteAddressModal email={address.Email} onDeleteAddress={handleDelete} {...deleteAddressProps} />
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
