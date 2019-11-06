import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
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
    TableRow
} from 'react-components';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { generateMemberAddressKey } from 'proton-shared/lib/keys/organizationKeys';
import { decryptMemberToken } from 'proton-shared/lib/keys/memberToken';
import { decryptPrivateKeyArmored, generateAddressKey } from 'proton-shared/lib/keys/keys';

import SelectEncryption from '../keys/addKey/SelectEncryption';
import MissingKeysStatus, { STATUS } from './MissingKeysStatus';
import { createMemberAddressKeys } from '../members/actionHelper';
import { createKeyHelper } from '../keys/shared/actionHelper';

const updateAddress = (oldAddresses, address, status) => {
    return oldAddresses.map((oldAddress) => {
        if (oldAddress.ID === address.ID) {
            return { ...address, status };
        }
        return oldAddress;
    });
};

const CreateMissingKeysAddressModal = ({ onClose, member, addresses, organizationKey, ...rest }) => {
    const api = useApi();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const doneRef = useRef(false);
    const [formattedAddresses, setFormattedAddresses] = useState(() =>
        addresses.map((address) => ({
            ...address,
            status: {
                type: STATUS.QUEUED
            }
        }))
    );

    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);

    const processMember = async () => {
        const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];

        const PrimaryKey = member.Keys.find(({ Primary }) => Primary === 1);

        if (!PrimaryKey) {
            return createNotification({ text: c('Error').t`Member keys are not set up.` });
        }

        const decryptedToken = await decryptMemberToken(PrimaryKey.Token, organizationKey);
        const primaryMemberKey = await decryptPrivateKeyArmored(PrimaryKey.PrivateKey, decryptedToken);

        await Promise.all(
            addresses.map(async (address) => {
                try {
                    setFormattedAddresses((oldState) => updateAddress(oldState, address, { type: STATUS.LOADING }));

                    await createMemberAddressKeys({
                        api,
                        Member: member,
                        Address: address,
                        keys: [], // Assume no keys exists for this address since we are in this modal.
                        ...(await generateMemberAddressKey({
                            email: address.Email,
                            primaryKey: primaryMemberKey,
                            organizationKey,
                            encryptionConfig
                        }))
                    });

                    setFormattedAddresses((oldState) => updateAddress(oldState, address, { type: STATUS.DONE }));
                } catch (e) {
                    setFormattedAddresses((oldState) =>
                        updateAddress(oldState, address, { type: STATUS.FAILURE, tooltip: e.message })
                    );
                }
            })
        );

        await call();
    };

    const processSelf = async () => {
        const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];

        await Promise.all(
            addresses.map(async (address) => {
                try {
                    setFormattedAddresses((oldState) => updateAddress(oldState, address, { type: STATUS.LOADING }));

                    const { privateKey, privateKeyArmored } = await generateAddressKey({
                        email: address.Email,
                        passphrase: authentication.getPassword(),
                        encryptionConfig
                    });

                    await createKeyHelper({
                        api,
                        privateKey,
                        privateKeyArmored,
                        Address: address,
                        keys: []
                    });

                    setFormattedAddresses((oldState) => updateAddress(oldState, address, { type: STATUS.DONE }));
                } catch (e) {
                    setFormattedAddresses((oldState) =>
                        updateAddress(oldState, address, { type: STATUS.FAILURE, tooltip: e.message })
                    );
                }
            })
        );

        await call();
    };

    const handleSubmit = () => {
        if (doneRef.current) {
            return onClose();
        }
        doneRef.current = true;

        withLoading(member.Self ? processSelf() : processMember());
    };

    return (
        <FormModal
            title={c('Title').t`Generate missing keys`}
            close={c('Action').t`Close`}
            submit={c('Action').t`Submit`}
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            {...rest}
        >
            <Alert>{c('Info')
                .t`Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them.`}</Alert>
            <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
            <Table>
                <TableHeader
                    cells={[c('Header for addresses table').t`Address`, c('Header for addresses table').t`Status`]}
                />
                <TableBody colSpan={2}>
                    {formattedAddresses.map((address) => (
                        <TableRow
                            key={address.ID}
                            cells={[address.Email, <MissingKeysStatus key={0} {...address.status} />]}
                        />
                    ))}
                </TableBody>
            </Table>
        </FormModal>
    );
};

CreateMissingKeysAddressModal.propTypes = {
    onClose: PropTypes.func,
    organizationKey: PropTypes.object,
    member: PropTypes.object.isRequired,
    addresses: PropTypes.array.isRequired
};

export default CreateMissingKeysAddressModal;
