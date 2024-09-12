import { c } from 'ttag';

import { MimeIcon } from '@proton/components';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewDocumentButton = ({ close, action }: Props) => {
    return (
        <ContextMenuButton
            testId="context-menu-new-document"
            icon={<MimeIcon name="proton-doc" className="mr-2" />}
            name={c('Action').t`New document`}
            action={action}
            close={close}
        />
    );
};

export default CreateNewDocumentButton;
