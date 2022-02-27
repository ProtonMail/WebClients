import { useState } from 'react';
import { c } from 'ttag';
import {
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    ENCRYPTION_TYPES,
    MEMBER_PRIVATE,
} from '@proton/shared/lib/constants';
import { missingKeysMemberProcess, missingKeysSelfProcess } from '@proton/shared/lib/keys';
import { noop } from '@proton/shared/lib/helpers/function';
import { Address, Member, CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import { getAllMemberAddresses } from '@proton/shared/lib/api/members';

import {
    Alert,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    ModalTwoHeader,
    ModalTwoFooter,
    Button,
    ModalTwo,
    ModalTwoContent,
    ModalProps,
} from '../../../components';
import {
    useApi,
    useAuthentication,
    useEventManager,
    useGetAddresses,
    useGetUserKeys,
    useLoading,
    useNotifications,
} from '../../../hooks';

import SelectEncryption from '../../keys/addKey/SelectEncryption';
import MissingKeysStatus from './MissingKeysStatus';
import { AddressWithStatus, Status } from './interface';
import { updateAddress } from './state';

enum STEPS {
    INIT = 0,
    DONE,
    ERROR,
}

interface Props extends ModalProps {
    member?: Member;
    addressesToGenerate: Address[];
    organizationKey?: CachedOrganizationKey;
}

const getStatus = (text: 'ok' | 'loading' | 'error') => {
    switch (text) {
        case 'ok':
            return Status.DONE;
        case 'loading':
            return Status.LOADING;
        default:
        case 'error':
            return Status.FAILURE;
    }
};

const CreateMissingKeysAddressModal = ({ member, addressesToGenerate, organizationKey, ...rest }: Props) => {
    const api = useApi();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState(STEPS.INIT);
    const getUserKeys = useGetUserKeys();
    const getAddresses = useGetAddresses();
    const [formattedAddresses, setFormattedAddresses] = useState<AddressWithStatus[]>(() =>
        addressesToGenerate.map((address) => ({
            ...address,
            status: {
                type: Status.QUEUED,
            },
        }))
    );

    const [encryptionType, setEncryptionType] = useState<ENCRYPTION_TYPES>(DEFAULT_ENCRYPTION_CONFIG);

    const processMember = async (member: Member) => {
        if (!organizationKey?.privateKey) {
            createNotification({ text: c('Error').t`Organization key is not decrypted`, type: 'error' });
            return;
        }
        const memberAddresses = await getAllMemberAddresses(api, member.ID);
        try {
            const addresses = await getAddresses();

            await missingKeysMemberProcess({
                api,
                encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
                ownerAddresses: addresses,
                memberAddressesToGenerate: addressesToGenerate,
                member,
                memberAddresses,
                onUpdate: (addressID, event) => {
                    setFormattedAddresses((oldState) => {
                        return updateAddress(oldState, addressID, {
                            status: {
                                type: getStatus(event.status),
                                tooltip: event.result,
                            },
                        });
                    });
                },
                organizationKey: organizationKey.privateKey,
            });
            await call();
        } catch (e: any) {
            createNotification({ text: e.message });
        }
    };

    const processSelf = async () => {
        const [userKeys, addresses] = await Promise.all([getUserKeys(), getAddresses()]);
        await missingKeysSelfProcess({
            api,
            userKeys,
            addresses,
            addressesToGenerate,
            password: authentication.getPassword(),
            encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
            onUpdate: (addressID, event) => {
                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, addressID, {
                        status: {
                            type: getStatus(event.status),
                            tooltip: event.result,
                        },
                    });
                });
            },
        });
        await call();
    };

    const handleSubmit = () => {
        if (step === STEPS.INIT) {
            withLoading(
                (!member || (member.Self && member.Private === MEMBER_PRIVATE.UNREADABLE)
                    ? processSelf()
                    : processMember(member)
                )
                    .then(() => setStep(STEPS.DONE))
                    .catch(() => setStep(STEPS.ERROR))
            );
        } else {
            rest.onClose?.();
        }
    };

    const submitText = (() => {
        if (step === STEPS.DONE) {
            return c('Action').t`Done`;
        }
        if (step === STEPS.ERROR) {
            return c('Action').t`Close`;
        }
        return c('Action').t`Submit`;
    })();

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Generate missing keys`} />
            <ModalTwoContent>
                <Alert className="mb1">{c('Info')
                    .t`Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them.`}</Alert>
                <SelectEncryption
                    encryptionType={encryptionType}
                    setEncryptionType={step === STEPS.INIT ? setEncryptionType : noop}
                />
                <Table>
                    <TableHeader
                        cells={[c('Header for addresses table').t`Address`, c('Header for addresses table').t`Status`]}
                    />
                    <TableBody colSpan={2}>
                        {formattedAddresses.map((address) => (
                            <TableRow
                                key={address.ID}
                                cells={[
                                    <span key={0} className="text-ellipsis block pr1" title={address.Email}>
                                        {address.Email}
                                    </span>,
                                    <MissingKeysStatus key={1} {...address.status} />,
                                ]}
                            />
                        ))}
                    </TableBody>
                </Table>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Close`}</Button>
                <Button color="norm" loading={loading} onClick={handleSubmit}>
                    {submitText}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreateMissingKeysAddressModal;
