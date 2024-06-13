import { c } from 'ttag';

import { DOCS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { DecryptedLink } from '../../../../store';
import { useOpenInDocs } from '../../../../store/_documents';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    close: () => void;
}

const OpenInDocsButton = ({ shareId, link }: Props) => {
    const { openInDocsAction } = useOpenInDocs(link);

    return (
        <ContextMenuButton
            name={
                // translator: Open in Docs
                c('Action').t`Open in ${DOCS_SHORT_APP_NAME}`
            }
            icon="file-arrow-out"
            testId="context-menu-open-in-docs"
            action={() => openInDocsAction({ shareId, linkId: link.linkId })}
            close={close}
        />
    );
};

export default OpenInDocsButton;
