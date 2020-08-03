import React, { useState } from 'react';
import { c } from 'ttag';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from 'proton-shared/lib/constants';
import { decryptMemberToken } from 'proton-shared/lib/keys/memberToken';
import { noop } from 'proton-shared/lib/helpers/function';

import { decryptPrivateKey } from 'pmcrypto';
import { Address, Member } from 'proton-shared/lib/interfaces';
import SelectEncryption from '../../keys/addKey/SelectEncryption';
import MissingKeysStatus from './MissingKeysStatus';
import {
    useApi,
    useAuthentication,
    useNotifications,
    useEventManager,
    useLoading,
    FormModal,
    Alert,
    Table,
    TableHeader,
    TableBody,
    TableRow,
} from '../../../index';
import { AddressWithStatus, Status } from './interface';
import missingKeysSelfProcess from './missingKeysSelfProcess';
import missingKeysMemberProcess from './missingKeysMemberProcess';
import { OrganizationKey } from '../../../hooks/useGetOrganizationKeyRaw';

enum STEPS {
    INIT = 0,
    DONE,
    ERROR,
}

interface Props {
    onClose?: () => void;
    member?: Member;
    addresses: Address[];
    organizationKey?: OrganizationKey;
}
const CreateMissingKeysAddressModal = ({ onClose, member, addresses, organizationKey, ...rest }: Props) => {
    const api = useApi();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState(STEPS.INIT);
    const [formattedAddresses, setFormattedAddresses] = useState<AddressWithStatus[]>(() =>
        addresses.map((address) => ({
            ...address,
            status: {
                type: Status.QUEUED,
            },
        }))
    );

    const [encryptionType, setEncryptionType] = useState<ENCRYPTION_TYPES>(DEFAULT_ENCRYPTION_CONFIG);

    const processMember = async () => {
        if (!member) {
            throw new Error('Invalid member');
        }
        const PrimaryKey = member.Keys.find(({ Primary }) => Primary === 1);

        if (!PrimaryKey) {
            createNotification({ text: c('Error').t`Member keys are not set up.` });
            return;
        }
        if (!PrimaryKey.Token) {
            createNotification({ text: c('Error').t`Member token invalid.` });
            return;
        }
        if (!organizationKey?.privateKey) {
            createNotification({ text: c('Error').t`Organization key is not decrypted.` });
            return;
        }

        const decryptedToken = await decryptMemberToken(PrimaryKey.Token, organizationKey.privateKey);
        const primaryMemberKey = await decryptPrivateKey(PrimaryKey.PrivateKey, decryptedToken);

        await missingKeysMemberProcess({
            api,
            encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
            addresses,
            member,
            setFormattedAddresses,
            primaryMemberKey,
            organizationKey: organizationKey.privateKey,
        });
        await call();
    };

    const processSelf = async () => {
        await missingKeysSelfProcess({
            api,
            addresses,
            password: authentication.getPassword(),
            encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
            setFormattedAddresses,
        });
        await call();
    };

    const handleSubmit = () => {
        if (step === STEPS.INIT) {
            withLoading(
                (!member || member.Self ? processSelf() : processMember())
                    .then(() => setStep(STEPS.DONE))
                    .catch(() => setStep(STEPS.ERROR))
            );
        } else {
            onClose?.();
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
        <FormModal
            title={c('Title').t`Generate missing keys`}
            close={c('Action').t`Close`}
            submit={submitText}
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            {...rest}
        >
            <Alert>{c('Info')
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
                                <span key={0} className="ellipsis bl pr1" title={address.Email}>
                                    {address.Email}
                                </span>,
                                <MissingKeysStatus key={1} {...address.status} />,
                            ]}
                        />
                    ))}
                </TableBody>
            </Table>
        </FormModal>
    );
};

export default CreateMissingKeysAddressModal;
