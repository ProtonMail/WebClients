import { useEffect, useState } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    Loader,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useApi,
    useGetEncryptionPreferences,
    useGetUserKeys,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getContact, updateContact } from '@proton/shared/lib/api/contacts';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { resignCards } from '@proton/shared/lib/contacts/resign';
import { ContactCard, ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { LoadingMap } from '@proton/shared/lib/interfaces/utils';
import { splitKeys } from '@proton/shared/lib/keys/keys';

interface Props extends ModalProps {
    title: string;
    contacts: { contactID: string }[];
    children: React.ReactNode;
    submit?: string;
    onResign?: () => void;
    onNotResign?: () => void;
    onError?: () => void;
    onResolve?: () => void;
    onReject?: () => void;
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
                ContactEmails.map(async ({ Email }: ContactEmail) => {
                    const { pinnedKeys } = await getEncryptionPreferences(Email);
                    const fingerprints = pinnedKeys.map((key) => key.getFingerprint());
                    if (fingerprints.length) {
                        fingerprintsByEmail[Email] = fingerprints;
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
                <span className="flex max-w100 flex-nowrap on-mobile-flex-column">
                    <strong className="mr-1">{`${email}:`}</strong>
                    <span className="flex-item-fluid">
                        {fingerprints.map((f: string, i: number) => (
                            <span className="text-ellipsis inline-block max-w100" title={f} key={f}>
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
                <PrimaryButton
                    disabled={loadingContacts}
                    loading={loadingResign}
                    type="submit"
                    data-testid="resign-contact"
                >
                    {submit}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactResignModal;
