import { useMemo } from 'react';

import { c } from 'ttag';

import { Banner, Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';

import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';

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
        <Banner
            data-testid="encrypted-subject-banner"
            variant="norm-outline"
            icon={
                <Tooltip title={c('Info').t`Subject is end-to-end encrypted`}>
                    <Icon name="lock" alt={c('Info').t`Subject is end-to-end encrypted`} />
                </Tooltip>
            }
        >
            {c('Info').t`Subject:`} {subjectElement}
        </Banner>
    );
};

export default ExtraDecryptedSubject;
