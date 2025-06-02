import { MimeIcon } from '@proton/components';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype';

import ContextMenuButton from '../ContextMenuButton';

interface Props {
    openDocument: () => void;
    close: () => void;
    type: ProtonDocumentType;
    isNative: boolean;
}

const OpenInDocsButton = ({ openDocument, close, type, isNative }: Props) => {
    return (
        <ContextMenuButton
            name={getOpenInDocsString({ type, isNative })}
            icon={<MimeIcon name={getOpenInDocsMimeIconName({ type })} className="mr-2" />}
            testId="context-menu-open-in-docs"
            action={openDocument}
            close={close}
        />
    );
};

export default OpenInDocsButton;
