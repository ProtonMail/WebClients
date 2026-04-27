import React, { useState } from 'react';
import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, Select, useApi, useNotifications } from '@proton/components/index';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import {
    buildPersonalAccessTokenKey,
    EXPIRATION_OPTIONS,
    getExpirationTimestamp,
} from './apiKeysHelpers';
import {
    createPersonalAccessTokenRequest,
    type CreatePersonalAccessTokenResponse,
} from '../../remote/personalAccessToken';

export const CreateKeyForm = ({ onCancel, onCreated }: { onCancel: () => void; onCreated: (token: string) => void }) => {
    const api = useApi();
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();

    const [name, setName] = useState('');
    const [expirationDays, setExpirationDays] = useState('90');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            setNameError(c('collider_2025: Error').t`Name is required`);
            return;
        }
        if (name.length > 191) {
            setNameError(c('collider_2025: Error').t`Name must be 191 characters or fewer`);
            return;
        }

        setIsSubmitting(true);
        setNameError('');

        try {
            const userKeys = await getUserKeys();
            const primaryKey = getPrimaryKey(userKeys);

            if (!primaryKey?.publicKey) {
                createNotification({
                    type: 'error',
                    text: c('collider_2025: Error').t`Could not retrieve your encryption key`,
                });
                return;
            }

            const personalAccessTokenKey = await buildPersonalAccessTokenKey(primaryKey.publicKey);
            const response = await api<CreatePersonalAccessTokenResponse>(
                createPersonalAccessTokenRequest({
                    Name: name.trim(),
                    Products: ['lumo'],
                    PersonalAccessTokenKey: personalAccessTokenKey,
                    ExpireTime: getExpirationTimestamp(Number(expirationDays)),
                })
            );

            if (response.PersonalAccessToken.Token) {
                onCreated(response.PersonalAccessToken.Token);
            }
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Failed to create API key`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="api-keys-form-card rounded-lg">
            <h4 className="api-keys-form-title m-0 mb-4">{c('collider_2025: Title').t`Create new API key`}</h4>

            <div className="api-keys-form-fields">
                <InputFieldTwo
                    id="api-key-name"
                    label={c('Label').t`Key name`}
                    placeholder={c('Placeholder').t`e.g. My automation script`}
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    error={nameError}
                    assistContainerClassName={nameError ? undefined : 'hidden'}
                    maxLength={191}
                    autoFocus
                />
                <div className="api-keys-form-expiry">
                    <label className="api-keys-form-expiry-label block m-0 mb-1.5" htmlFor="api-key-expiry">
                        {c('Label').t`Expires in`}
                    </label>
                    <Select
                        id="api-key-expiry"
                        value={expirationDays}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setExpirationDays(e.target.value)}
                        options={EXPIRATION_OPTIONS}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-4 api-keys-form-footer">
                <Button shape="outline" color="weak" onClick={onCancel} disabled={isSubmitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" onClick={handleCreate} loading={isSubmitting} disabled={isSubmitting}>
                    {c('Action').t`Create key`}
                </Button>
            </div>
        </div>
    );
};
