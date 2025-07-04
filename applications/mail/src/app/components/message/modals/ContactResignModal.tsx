import * as React from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import {
    Form,
    Loader,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useApi,
    useGetEncryptionPreferences,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getContact, updateContact } from '@proton/shared/lib/api/contacts';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { resignCards } from '@proton/shared/lib/contacts/resign';
import type { ContactCard, ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { LoadingMap } from '@proton/shared/lib/interfaces/utils';
import { splitKeys } from '@proton/shared/lib/keys/keys';

interface Props extends ModalProps {
    title: string;
    contacts: { contactID: string }[];
    children: React.ReactNode;
    submit?: string;
    onResign?: () => void;
    onNotResign?: () => void;
    onError?: () => void;
    onResolve: () => void;
    onReject: () => void;
}
const ContactResignModal = ({
    title,
    contacts,
    children,
    submit = c('Action').t`Re-sign`,
    onResign,
    onNotResign,
    onError,
    onResolve,
    onReject,
    onClose,
    ...rest
}: Props) => {
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();
    const [contactFingerprintsByEmailMap, setContactFingerprintsByEmailMap] = useState<{
        [key: string]: string[] | undefined;
    }>({});
    const [contactCardsMap, setContactCardsMap] = useState<{ [key: string]: ContactCard[] | undefined }>({});
    const [loadingMap, setLoadingMap] = useState<LoadingMap>(
        contacts.reduce<{ [key: string]: boolean }>((acc, { contactID }) => {
            acc[contactID] = true;
            return acc;
        }, {})
    );
    const [loadingResign, withLoadingResign] = useLoading();

    const getEncryptionPreferences = useGetEncryptionPreferences();
    const api = useApi();

    useEffect(() => {
        const getContactFingerprintsByEmailMap = async (contactID: string) => {
            const {
                Contact: { Cards, ContactEmails },
            } = await api(getContact(contactID));

            const fingerprintsByEmail: { [key: string]: string[] | undefined } = {};

            await Promise.all(
                ContactEmails.map(async ({ Email: email }: ContactEmail) => {
                    const { pinnedKeys } = await getEncryptionPreferences({ email });
                    const fingerprints = pinnedKeys.map((key) => key.getFingerprint());
                    if (fingerprints.length) {
                        fingerprintsByEmail[email] = fingerprints;
                    }
                })
            );

            setContactFingerprintsByEmailMap((fingerprintsByEmailMap) => ({
                ...fingerprintsByEmailMap,
                ...fingerprintsByEmail,
            }));
            setContactCardsMap((map) => ({ ...map, [contactID]: Cards }));
            setLoadingMap((map) => ({ ...map, [contactID]: false }));
        };

        void Promise.all(contacts.map(({ contactID }) => getContactFingerprintsByEmailMap(contactID)));
    }, []);

    const handleSubmit = async () => {
        try {
            const { privateKeys } = splitKeys(await getUserKeys());
            const resignedCardsMap: { [key: string]: ContactCard[] } = {};
            await Promise.all(
                contacts.map(async ({ contactID }) => {
                    const contactCards = contactCardsMap[contactID];
                    if (!contactCards || loadingMap[contactID]) {
                        return;
                    }
                    const resignedCards = await resignCards({
                        contactCards,
                        privateKeys: [privateKeys[0]],
                    });
                    resignedCardsMap[contactID] = resignedCards;
                })
            );
            const requests = contacts.map(
                ({ contactID }) =>
                    () =>
                        api(updateContact(contactID, { Cards: resignedCardsMap[contactID] }))
            );
            // the routes called in requests support 100 calls every 10 seconds
            await processApiRequestsSafe(requests, 100, 10 * 1000);
            onResign?.();
            onResolve?.();
        } catch (error: any) {
            createNotification({ text: error.message, type: 'error' });
            onError?.();
        } finally {
            onReject?.();
            onClose?.();
        }
    };
    const handleClose = () => {
        onNotResign?.();
        onReject?.();
        onClose?.();
    };

    const renderEmailRow = (email: string) => {
        const fingerprints = contactFingerprintsByEmailMap[email];

        if (!fingerprints) {
            return null;
        }

        return (
            <li key={email}>
                <span className="flex max-w-full flex-nowrap flex-column md:flex-row">
                    <strong className="mr-1">{`${email}:`}</strong>
                    <span className="md:flex-1">
                        {fingerprints.map((f: string, i: number) => (
                            <span className="text-ellipsis inline-block max-w-full" title={f} key={f}>
                                {`${f}${i + 1 !== fingerprints.length ? ', ' : ''}`}
                            </span>
                        ))}
                    </span>
                </span>
            </li>
        );
    };

    const loadingContacts = Object.values(loadingMap).some((loading) => loading === true);
    const emailsWithKeys = Object.values(contactFingerprintsByEmailMap);

    const content = emailsWithKeys.length ? (
        <>
            <div>
                {c('Info')
                    .t`Do you want to re-sign the contact details and in the process trust the keys with the following fingerprints?`}
            </div>
            {loadingContacts ? (
                <Loader />
            ) : (
                <div>
                    <ul>{Object.keys(contactFingerprintsByEmailMap).map(renderEmailRow)}</ul>
                </div>
            )}
        </>
    ) : (
        <div>{c('Info').t`Do you want to re-sign the contact details?`}</div>
    );

    return (
        <ModalTwo
            size="large"
            as={Form}
            {...rest}
            onSubmit={() => withLoadingResign(handleSubmit())}
            onClose={handleClose}
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                {children}
                {content}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    disabled={loadingContacts}
                    loading={loadingResign}
                    type="submit"
                    data-testid="resign-contact"
                >
                    {submit}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactResignModal;
