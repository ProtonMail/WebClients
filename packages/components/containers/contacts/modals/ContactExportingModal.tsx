import { useEffect, useMemo, useRef, useState } from 'react';

import { format } from 'date-fns';
import { c, msgid } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import DynamicProgress from '@proton/components/components/progress/DynamicProgress';
import useApi from '@proton/components/hooks/useApi';
import { useContacts } from '@proton/mail/contacts/hooks';
import { exportContactsFromIds, exportContactsFromLabel } from '@proton/shared/lib/contacts/helpers/export';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import noop from '@proton/utils/noop';

const DOWNLOAD_FILENAME = 'protonContacts';

export interface ContactExportingProps {
    contactGroupID?: string;
    onSave?: () => void;
    inputContactsIds?: string[];
}

type Props = ContactExportingProps & ModalProps;

const ContactExportingModal = ({ contactGroupID: LabelID, onSave = noop, inputContactsIds, ...rest }: Props) => {
    const abortController = useRef<AbortController | undefined>();
    const api = useApi();
    const [contacts = [], loadingContacts] = useContacts();
    const contactsToDownload = useMemo(() => {
        return inputContactsIds ? contacts.filter((contact) => inputContactsIds.includes(contact.ID)) : contacts;
    }, [contacts, inputContactsIds]);
    const getUserKeys = useGetUserKeys();

    const [contactsExported, addSuccess] = useState<string[]>([]);
    const [contactsNotExported, addError] = useState<string[]>([]);

    const countContacts = LabelID
        ? contactsToDownload.filter(({ LabelIDs = [] }) => LabelIDs.includes(LabelID)).length
        : contactsToDownload.length;

    const handleSave = (vcards: string[]) => {
        const allVcards = vcards.join('\r\n');
        const blob = new Blob([allVcards], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, `${DOWNLOAD_FILENAME}-${format(Date.now(), 'yyyy-MM-dd')}.vcf`);
        onSave();
        rest.onClose?.();
    };

    useEffect(() => {
        if (loadingContacts) {
            return;
        }

        abortController.current = new AbortController();
        const run = async () => {
            if (!abortController.current) {
                return;
            }
            const userKeys = await getUserKeys();
            /* There are 2 cases to export contacts
             * 1- Export a selection of contacts
             * 2- Export all contacts
             */
            if (inputContactsIds) {
                exportContactsFromIds({
                    contactIDs: inputContactsIds,
                    count: contacts.length,
                    userKeys,
                    signal: abortController.current.signal,
                    api,
                    callbackSuccess: (contactExported) =>
                        addSuccess((contactsExported) => [...contactsExported, contactExported]),
                    callbackFailure: (ID) => addError((contactsNotExported) => [...contactsNotExported, ID]),
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        rest.onClose?.(); // close the modal; otherwise it is left hanging in there
                        throw error;
                    }
                });
            } else {
                exportContactsFromLabel({
                    labelID: LabelID,
                    count: countContacts,
                    userKeys,
                    signal: abortController.current.signal,
                    api,
                    callbackSuccess: (contactExported) =>
                        addSuccess((contactsExported) => [...contactsExported, contactExported]),
                    callbackFailure: (ID) => addError((contactsNotExported) => [...contactsNotExported, ID]),
                }).catch((error) => {
                    if (error.name !== 'AbortError') {
                        rest.onClose?.(); // close the modal; otherwise it is left hanging in there
                        throw error;
                    }
                });
            }
        };
        run();

        return () => {
            abortController.current?.abort();
        };
    }, [loadingContacts]);

    const success = contactsNotExported.length !== countContacts;
    const loading = loadingContacts || contactsExported.length + contactsNotExported.length !== countContacts;

    /*
     * The way the export contacts logic is built is creating an "issue" when exporting a huge selection of contacts.
     * If we export more than 300 contacts, we need to get all contacts from the API, and filter them on the fly.
     * The problem is that when all selected contacts are downloaded, the user can save the vcard,
     * while some requests are still being performed in the background.
     *
     * Let's take an example to explain the problem:
     * The user selects the first 301 contacts out of 1000 contacts
     * We are getting pages of 50 contacts from the api.
     * When the user will have made 7 requests (for 350 contacts), he will be able to download the vcard.
     * However, the download process of the rest of the pages will still be running, making useless requests.
     * If the user is downloading the vCard or closing the modal the process will stop,
     * but if the modal stays opened forever, all the pages will be downloaded
     *
     * To avoid this, when we detect that loading has ended (all selected contacts have been downloaded),
     * we can stop the process
     */
    useEffect(() => {
        if (!loading) {
            abortController.current?.abort();
        }
    }, [loading]);

    const display =
        loading || success
            ? c('Progress bar description').ngettext(
                  msgid`${contactsExported.length} out of ${countContacts} contact successfully exported.`,
                  `${contactsExported.length} out of ${countContacts} contacts successfully exported.`,
                  countContacts
              )
            : c('Progress bar description').t`No contacts exported.`;

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Exporting contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4">
                    {c('Description')
                        .t`Decrypting contacts… This may take a few minutes. When the process is completed, you will be able to download the file with all your contacts exported.`}
                </Alert>
                <DynamicProgress
                    id="progress-export-contacts"
                    loading={loading}
                    value={contactsExported.length + contactsNotExported.length}
                    max={countContacts}
                    success={success}
                    display={loadingContacts ? '' : display}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" disabled={loading} onClick={() => handleSave(contactsExported)}>
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactExportingModal;
