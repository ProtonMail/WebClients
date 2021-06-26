import React, { useEffect, useRef, useState } from 'react';
import { c, msgid } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { Contact } from '@proton/shared/lib/interfaces/contacts';
import { Key } from '@proton/shared/lib/interfaces';
import { dropDataEncryptedWithAKey } from '@proton/shared/lib/contacts/globalOperations';
import { Alert, Button, DynamicProgress, FormModal, PrimaryButton } from '../../../components';
import { useApi, useContacts, useEventManager, useUserKeys } from '../../../hooks';

interface Props {
    errorKey: Key;
    onClose?: () => void;
}

const ContactClearDataExecutionModal = ({ onClose = noop, errorKey, ...rest }: Props) => {
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
            onClose();
        }
    }, [closing, execution]);

    const handleClose = () => {
        exitRef.current = true;
        setClosing(true);
    };

    return (
        <FormModal
            title={c('Title').t`Clearing data`}
            onSubmit={onClose}
            onClose={handleClose}
            submit={
                <PrimaryButton disabled={execution} type="submit">
                    {c('Action').t`Done`}
                </PrimaryButton>
            }
            close={execution ? <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button> : null}
            {...rest}
        >
            <Alert type="info">{c('Info')
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
        </FormModal>
    );
};

export default ContactClearDataExecutionModal;
