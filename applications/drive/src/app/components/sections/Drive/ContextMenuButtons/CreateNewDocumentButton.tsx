import { c } from 'ttag';

import { NewFeatureTag } from '@proton/components/components';
import documentIcon from '@proton/styles/assets/img/drive/file-document-proton.svg';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewDocumentButton = ({ close, action }: Props) => {
    return (
        <ContextMenuButton
            testId="context-menu-new-document"
            icon={<img className="mr-2 pointer-events-none" src={documentIcon} alt="" aria-hidden="true" />}
            name={c('Action').t`New document`}
            action={action}
            close={close}
        >
            {/* TODO: Remove New tag when expired */}
            <NewFeatureTag featureKey="documents" endDate={new Date('2024-07-15')} className="ml-4" />
        </ContextMenuButton>
    );
};

export default CreateNewDocumentButton;
