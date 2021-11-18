import { c } from 'ttag';
import { deleteAddress, enableAddress, disableAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Address, Member, CachedOrganizationKey } from '@proton/shared/lib/interfaces';

import { DropdownActions, Alert, ErrorButton, ConfirmModal } from '../../components';
import { useModals, useApi, useEventManager, useLoading, useNotifications } from '../../hooks';

import CreateMissingKeysAddressModal from './missingKeys/CreateMissingKeysAddressModal';
import { AddressPermissions } from './helper';

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
    const { createModal } = useModals();

    const confirmDelete = async () => {
        return new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Delete ${address.Email}`}
                    onConfirm={resolve}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onClose={reject}
                >
                    <Alert className="mb1" type="info">{c('Info')
                        .t`Please note that if you delete this address, you will no longer be able to send or receive emails using this address.`}</Alert>
                    <Alert className="mb1" type="error">{c('Info')
                        .t`Are you sure you want to delete this address?`}</Alert>
                </ConfirmModal>
            );
        });
    };

    const handleDelete = async () => {
        await confirmDelete();
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

    const confirmDisable = async () => {
        return new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal onConfirm={resolve} onClose={reject}>
                    <Alert className="mb1" type="warning">{c('Warning')
                        .t`By disabling this address, you will no longer be able to send or receive emails using this address and all the linked Proton products will also be disabled. Are you sure you want to disable this address?`}</Alert>
                </ConfirmModal>
            );
        });
    };

    const handleDisable = async () => {
        await confirmDisable();
        await api(disableAddress(address.ID));
        await call();
        createNotification({ text: c('Success notification').t`Address disabled` });
    };

    const handleGenerate = async () => {
        createModal(
            <CreateMissingKeysAddressModal
                member={member}
                addressesToGenerate={[address]}
                organizationKey={organizationKey}
            />
        );
    };

    const list =
        savingIndex !== undefined
            ? [savingIndex === addressIndex ? { text: c('Address action').t`Saving` } : null].filter(isTruthy)
            : [
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
                      onClick: () => withLoading(handleDisable()),
                  },
                  permissions.canGenerate && {
                      text: c('Address action').t`Generate missing keys`,
                      onClick: () => withLoading(handleGenerate()),
                  },
                  permissions.canDelete &&
                      ({
                          text: c('Address action').t`Delete`,
                          actionType: 'delete',
                          onClick: () => withLoading(handleDelete()),
                      } as const),
              ].filter(isTruthy);

    return list.length ? (
        <DropdownActions size="small" list={list} loading={loading || savingIndex !== undefined} />
    ) : (
        <div
            // This is a placeholder to avoid height loss when dropdownActions are not rendered
            style={{ height: '24px' }}
        />
    );
};

export default AddressActions;
