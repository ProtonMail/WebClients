import React, { useEffect, useRef, useState } from 'react';
import { c, msgid } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { Contact } from 'proton-shared/lib/interfaces/contacts';
import { resignAllContacts } from 'proton-shared/lib/contacts/globalOperations';
import { Alert, Button, DynamicProgress, FormModal, PrimaryButton } from '../../../components';
import { useApi, useContacts, useEventManager, useUserKeys } from '../../../hooks';

interface Props {
    onClose?: () => void;
}

const ContactResignExecutionModal = ({ onClose = noop, ...rest }: Props) => {
    const [contacts = [], loadingContacts] = useContacts() as [Contact[] | undefined, boolean, Error];
    const [userKeys] = useUserKeys();
    const api = useApi();
    const { call } = useEventManager();

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
            await resignAllContacts(
                contacts,
                userKeys,
                api,
                (progress, update) => {
                    setProgress(progress);
                    setUpdated(update);
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
            title={c('Title').t`Re-signing contacts`}
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
                .t`Please wait while we look for contacts that can be re-signed with the primary encryption key.`}</Alert>
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

export default ContactResignExecutionModal;
