import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { format } from 'date-fns';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import noop from '@proton/utils/noop';
import { Contact } from '@proton/shared/lib/interfaces/contacts';
import { exportContactsFromLabel } from '@proton/shared/lib/contacts/helpers/export';

import {
    Button,
    Alert,
    DynamicProgress,
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    ModalProps,
} from '../../../components';
import { useContacts, useApi, useUserKeys } from '../../../hooks';

const DOWNLOAD_FILENAME = 'protonContacts';

export interface ContactExportingProps {
    contactGroupID?: string;
    onSave?: () => void;
}

type Props = ContactExportingProps & ModalProps;

const ContactExportingModal = ({ contactGroupID: LabelID, onSave = noop, ...rest }: Props) => {
    const api = useApi();
    const [contacts = [], loadingContacts] = useContacts() as [Contact[], boolean, Error];
    const [userKeysList, loadingUserKeys] = useUserKeys();

    const [contactsExported, addSuccess] = useState<string[]>([]);
    const [contactsNotExported, addError] = useState<string[]>([]);

    const countContacts = LabelID
        ? contacts.filter(({ LabelIDs = [] }) => LabelIDs.includes(LabelID)).length
        : contacts.length;

    const handleSave = (vcards: string[]) => {
        const allVcards = vcards.join('\n');
        const blob = new Blob([allVcards], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, `${DOWNLOAD_FILENAME}-${format(Date.now(), 'yyyy-MM-dd')}.vcf`);
        onSave();
        rest.onClose?.();
    };

    useEffect(() => {
        if (loadingContacts || loadingUserKeys) {
            return;
        }

        const abortController = new AbortController();

        exportContactsFromLabel(
            LabelID,
            countContacts,
            userKeysList,
            abortController.signal,
            api,
            (contactExported) => addSuccess((contactsExported) => [...contactsExported, contactExported]),
            (ID) => addError((contactsNotExported) => [...contactsNotExported, ID])
        ).catch((error) => {
            if (error.name !== 'AbortError') {
                rest.onClose?.(); // close the modal; otherwise it is left hanging in there
                throw error;
            }
        });

        return () => {
            abortController.abort();
        };
    }, [loadingContacts, loadingUserKeys]);

    const success = contactsNotExported.length !== countContacts;
    const loading = loadingContacts || contactsExported.length + contactsNotExported.length !== countContacts;
    const display =
        loading || success
            ? c('Progress bar description')
                  .t`${contactsExported.length} out of ${countContacts} contacts successfully exported.`
            : c('Progress bar description').t`No contacts exported.`;

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Exporting contacts`} />
            <ModalTwoContent>
                <Alert className="mb1">
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
                <Button color="norm" loading={loading} onClick={() => handleSave(contactsExported)}>
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactExportingModal;
