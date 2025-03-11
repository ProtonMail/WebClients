import { c } from 'ttag';

import { MimeIcon, ToolbarButton } from '@proton/components';

interface CreateNewDocumentButtonProps {
    onClick: () => void;
}

export const CreateNewDocumentButton = ({ onClick }: CreateNewDocumentButtonProps) => {
    return (
        <ToolbarButton
            icon={<MimeIcon name="proton-doc" />}
            title={c('Action').t`New document`}
            onClick={onClick}
            data-testid="toolbar-new-document"
        />
    );
};
