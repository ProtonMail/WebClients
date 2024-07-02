import { c } from 'ttag';

import { MimeIcon, NewFeatureTag } from '@proton/components/components';

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
        >
            {/* TODO: Remove New tag when expired */}
            <NewFeatureTag featureKey="documents" endDate={new Date('2024-07-15')} className="ml-4" />
        </ContextMenuButton>
    );
};

export default CreateNewDocumentButton;
