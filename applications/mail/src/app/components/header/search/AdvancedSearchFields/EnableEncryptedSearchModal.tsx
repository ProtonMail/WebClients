import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import type { ModalProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useEncryptedSearchContext } from '../../../../containers/EncryptedSearchProvider';

interface Props extends ModalProps {
    openSearchAfterEnabling?: boolean;
}
const EnableEncryptedSearchModal = ({ openSearchAfterEnabling, ...rest }: Props) => {
    const { enableEncryptedSearch, enableContentSearch, openDropdown } = useEncryptedSearchContext();
    const handleEnableES = async () => {
        if (openSearchAfterEnabling) {
            openDropdown();
        }

        void enableEncryptedSearch().then((success) => (success ? enableContentSearch() : undefined));
        rest.onClose?.();
    };

    return (
        <Prompt
            title={c('Title').t`Enable message content search`}
            buttons={[
                <Button color="norm" onClick={handleEnableES} data-testid="encrypted-search:enable">{c('Action')
                    .t`Enable`}</Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Action')
                .t`To search your emails securely, we need to download a copy of your messages to your browser. The initial download may take a moment.`}
            <br />
            <Href href={getKnowledgeBaseUrl('/search-message-content')}>{c('Info').t`Learn more`}</Href>
        </Prompt>
    );
};

export default EnableEncryptedSearchModal;
