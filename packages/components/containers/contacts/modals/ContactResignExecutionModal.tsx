import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import DynamicProgress from '@proton/components/components/progress/DynamicProgress';
import { resignAllContacts } from '@proton/shared/lib/contacts/globalOperations';

import type { ModalProps } from '../../../components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';
import { useApi, useContacts, useEventManager, useGetUserKeys } from '../../../hooks';

const ContactResignExecutionModal = ({ ...rest }: ModalProps) => {
    const [contacts = [], loadingContacts] = useContacts();
    const getUserKeys = useGetUserKeys();
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
            const userKeys = await getUserKeys();
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
            rest.onClose?.();
        }
    }, [closing, execution]);

    const handleClose = () => {
        exitRef.current = true;
        setClosing(true);
    };

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Re-signing contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4" type="info">{c('Info')
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
            </ModalTwoContent>
            <ModalTwoFooter>
                {execution ? <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button> : null}
                <Button color="norm" disabled={execution} onClick={rest.onClose}>{c('Action').t`Done`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactResignExecutionModal;
