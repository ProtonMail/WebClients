import { useEffect, useState } from 'react';

import { format } from 'date-fns';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import DynamicProgress from '@proton/components/components/progress/DynamicProgress';
import { exportContactsFromLabel } from '@proton/shared/lib/contacts/helpers/export';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../../components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';
import { useApi, useContacts, useGetUserKeys } from '../../../hooks';

const DOWNLOAD_FILENAME = 'protonContacts';

export interface ContactExportingProps {
    contactGroupID?: string;
    onSave?: () => void;
}

type Props = ContactExportingProps & ModalProps;

const ContactExportingModal = ({ contactGroupID: LabelID, onSave = noop, ...rest }: Props) => {
    const api = useApi();
    const [contacts = [], loadingContacts] = useContacts();
    const getUserKeys = useGetUserKeys();

    const [contactsExported, addSuccess] = useState<string[]>([]);
    const [contactsNotExported, addError] = useState<string[]>([]);

    const countContacts = LabelID
        ? contacts.filter(({ LabelIDs = [] }) => LabelIDs.includes(LabelID)).length
        : contacts.length;

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

        const abortController = new AbortController();
        const run = async () => {
            const userKeys = await getUserKeys();
            exportContactsFromLabel(
                LabelID,
                countContacts,
                userKeys,
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
        };
        run();

        return () => {
            abortController.abort();
        };
    }, [loadingContacts]);

    const success = contactsNotExported.length !== countContacts;
    const loading = loadingContacts || contactsExported.length + contactsNotExported.length !== countContacts;
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
