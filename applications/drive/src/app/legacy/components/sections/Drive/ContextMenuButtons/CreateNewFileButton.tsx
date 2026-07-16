import { c } from 'ttag';

import { IcFile } from '@proton/icons/icons/IcFile';

import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    action: () => void;
    close: () => void;
}

const CreateNewFileButton = ({ close, action }: Props) => {
    const title = c('Action').t`Create new text file`;
    return <ContextMenuButton testId="toolbar-new-file" icon={<IcFile />} name={title} action={action} close={close} />;
};

export default CreateNewFileButton;
