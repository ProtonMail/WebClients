import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { dropDataEncryptedWithAKey } from '@proton/shared/lib/contacts/globalOperations';
import { Key } from '@proton/shared/lib/interfaces';
import { Contact } from '@proton/shared/lib/interfaces/contacts';

import {
    Alert,
    DynamicProgress,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '../../../components';
import { useApi, useContacts, useEventManager, useUserKeys } from '../../../hooks';

export interface ContactClearDataExecutionProps {
    errorKey: Key;
}

type Props = ContactClearDataExecutionProps & ModalProps;

const ContactClearDataExecutionModal = ({ errorKey, ...rest }: Props) => {
    const [contacts = [], loadingContacts] = useContacts() as [Contact[] | undefined, boolean, Error];
    const api = useApi();
    const { call } = useEventManager();
    const [userKeys] = useUserKeys();

    const [progress, setProgress] = useState(0);
    const [updated, setUpdated] = useState(0);
    const [closing, setClosing] = useState(false);
    const [execution, setExecution] = useState(true);
    const exitRef = useRef(false);

    const max = contacts.length;

    useEffect(() => {
        if (loadingContacts) {
            return;
        }

        const execute = async () => {
            await dropDataEncryptedWithAKey(
                contacts,
                errorKey,
                userKeys,
                api,
                (progress, updated) => {
                    setProgress(progress);
                    setUpdated(updated);
                },
                exitRef
            );
            await call();
            setExecution(false);
        };

        void execute();
    }, [loadingContacts]);

    // Delayed closing not to leave ongoing process
    useEffect(() => {
        if (closing && !execution) {
            rest.onClose?.();
        }
    }, [closing, execution]);

    const handleClose = () => {
        exitRef.current = true;
        setClosing(true);
    };

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Clearing data`} />
            <ModalTwoContent>
                <Alert className="mb-4" type="info">{c('Info')
                    .t`Please wait while we look for contacts that contain data encrypted with the inactive key.`}</Alert>
                <DynamicProgress
                    id="clear-data-execution-progress"
                    value={progress}
                    display={
                        execution
                            ? c('Info').t`Checking contact ${progress} of ${max}...`
                            : c('Info').ngettext(
                                  msgid`${updated} contact updated successfully.`,
                                  `${updated} contacts updated successfully.`,
                                  updated
                              )
                    }
                    max={max}
                    loading={execution}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                {execution ? <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button> : null}
                <Button color="norm" disabled={execution} onClick={rest.onClose}>{c('Action').t`Done`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactClearDataExecutionModal;
