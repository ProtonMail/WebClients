import { setupAddress, orderAddress } from '@proton/shared/lib/api/addresses';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '@proton/shared/lib/constants';
import { unique } from '@proton/shared/lib/helpers/array';
import { noop } from '@proton/shared/lib/helpers/function';
import { Address } from '@proton/shared/lib/interfaces';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import { useState } from 'react';
import { c } from 'ttag';
import { AlertModal, Button, AlertModalProps, useModalState } from '../../components';
import {
    useAddresses,
    useLoading,
    useUser,
    useApi,
    useGetUserKeys,
    useAuthentication,
    useEventManager,
    useNotifications,
} from '../../hooks';
import { SettingsSectionWide } from '../account';

interface SuccessModalProps extends Omit<AlertModalProps, 'title' | 'buttons' | 'children'> {
    domain: string;
    addressToCreate: string;
    onSetAsDefault: () => void;
}

const SuccessModal = ({
    domain,
    addressToCreate: addressToCreateString,
    onSetAsDefault,
    ...rest
}: SuccessModalProps) => {
    const addressToCreate = <b key="address">{addressToCreateString}</b>;
    return (
        <AlertModal
            title={
                // translator: The variable here is the new domain. For example "Your example.com address is active"
                c('Title').t`Your ${domain} address is active`
            }
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        onSetAsDefault();
                        rest.onClose?.();
                    }}
                >{c('Action').t`Set as default`}</Button>,
                <Button onClick={rest.onClose}>{c('Action').t`No, thanks`}</Button>,
            ]}
            {...rest}
        >
            <div className="mb1 text-break">
                {
                    // translator: The variable here is the new address for the user. For example "Want to set me@example.com as your default email for sending messages?"
                    c('Info').jt`Want to set ${addressToCreate} as your default email for sending messages?`
                }
            </div>
            <div>
                {c('Info').t`You'll still be able to send and receive mail with your existing email address(es).`}
            </div>
        </AlertModal>
    );
};

interface Props {
    domain: string;
    onDone: () => void;
}

const NewDomainSection = ({ domain, onDone }: Props) => {
    const [user] = useUser();
    const { call } = useEventManager();
    const [addresses] = useAddresses();
    const getUserKeys = useGetUserKeys();
    const authentication = useAuthentication();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [createdAddress, setCreatedAddress] = useState<Address | null>(null);
    const [successModal, setSuccessModalOpen, renderSuccessModal] = useModalState();
    const protonMailAppName = getAppName(APPS.PROTONMAIL);

    const { Name } = user;
    const addressToCreate = `${Name}@${domain}`;

    const handleCreateAddress = async () => {
        const previousDisplayName = addresses[0]?.DisplayName;
        const previousSignature = addresses[0]?.Signature;

        const { Address } = await api(
            setupAddress({
                Domain: domain,
                DisplayName: previousDisplayName || '',
                Signature: previousSignature || '',
            })
        );
        const userKeys = await getUserKeys();
        await missingKeysSelfProcess({
            api,
            userKeys,
            addresses,
            addressesToGenerate: [Address],
            password: authentication.getPassword(),
            encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
            onUpdate: noop,
        });
        await call();
        setCreatedAddress(Address);
        createNotification({
            // translator: The variable here is the new address for the user. For example "me@example.com is now active"
            text: c('Info').t`${addressToCreate} is now active`,
        });
        setSuccessModalOpen(true);
    };

    const handleSetAsDefault = async () => {
        if (!createdAddress) {
            throw new Error('Missing created address');
        }
        const addressIds = unique([createdAddress.ID, ...addresses.map(({ ID }) => ID)]);
        await api(orderAddress(addressIds));
        await call();
    };

    return (
        <>
            {renderSuccessModal && (
                <SuccessModal
                    domain={domain}
                    addressToCreate={addressToCreate}
                    onSetAsDefault={handleSetAsDefault}
                    {...successModal}
                    onExit={onDone}
                />
            )}
            <SettingsSectionWide>
                <p>
                    {
                        // translator: The 1st variable here is the new domain, the 2nd is the app name. For example "Our new example.com domain is a convenient option for sending and receiving emails. You'll still be able to use your original ProtonMail address."
                        c('Info')
                            .t`Our new ${domain} domain is a convenient option for sending and receiving emails. You'll still be able to use your original ${protonMailAppName} address.`
                    }
                </p>

                <Button color="norm" loading={loading} onClick={() => withLoading(handleCreateAddress())}>
                    {
                        // translator: The variable here is the new address for the user. For example "Activate me@example.com"
                        c('Action').t`Activate ${addressToCreate}`
                    }
                </Button>
            </SettingsSectionWide>
        </>
    );
};

export default NewDomainSection;
