import { useMemo } from 'react';

import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';

import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { MessageStateWithData } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageStateWithData;
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

    if (message.data.Subject !== '...' || !subjectElement) {
        return null;
    }

    return (
        <div className="bg-norm rounded border px-2 py-1 mb-3 flex flex-nowrap" data-testid="encrypted-subject-banner">
            <div className="flex">
                <Tooltip title={c('Info').t`Subject is end-to-end encrypted`}>
                    <Icon
                        name="lock"
                        className="mt-1 mr-2 ml-1 flex-item-noshrink"
                        alt={c('Info').t`Subject is end-to-end encrypted`}
                    />
                </Tooltip>
                <div className="mr-2 mt-1 flex-1 pb-1">
                    {c('Info').t`Subject:`} {subjectElement}
                </div>
            </div>
        </div>
    );
};

export default ExtraDecryptedSubject;
