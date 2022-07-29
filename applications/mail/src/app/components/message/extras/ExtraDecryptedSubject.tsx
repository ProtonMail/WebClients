import { useMemo } from 'react';

import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';

import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const ExtraDecryptedSubject = ({ message }: Props) => {
    const { highlightMetadata, shouldHighlight } = useEncryptedSearchContext();
    const highlightSubject = shouldHighlight();

    const subjectElement = useMemo(() => {
        if (!!message.decryption?.decryptedSubject) {
            const { decryptedSubject } = message.decryption;
            if (highlightSubject) {
                return highlightMetadata(decryptedSubject, true).resultJSX;
            }
            return <span>{decryptedSubject}</span>;
        }
    }, [message.decryption?.decryptedSubject, highlightSubject]);

    if (message.data?.Subject !== '...' || !subjectElement) {
        return null;
    }

    return (
        <div
            className="bg-norm rounded border px0-5 py0-3 mb0-85 flex flex-nowrap"
            data-testid="encrypted-subject-banner"
        >
            <div className="flex">
                <Tooltip title={c('Info').t`Subject is end-to-end encrypted`}>
                    <Icon
                        name="lock"
                        className="mt0-3 mr0-5 ml0-2 flex-item-noshrink"
                        alt={c('Info').t`Subject is end-to-end encrypted`}
                    />
                </Tooltip>
                <div className="mr0-5 mt0-2 flex-item-fluid pb0-25">
                    {c('Info').t`Subject:`} {subjectElement}
                </div>
            </div>
        </div>
    );
};

export default ExtraDecryptedSubject;
