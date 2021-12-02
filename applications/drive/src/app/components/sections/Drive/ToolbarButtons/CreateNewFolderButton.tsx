import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useToolbarActions from '../../../../hooks/drive/useActions';

const CreateNewFolderButton = () => {
    const { openCreateFolder } = useToolbarActions();

    return (
        <ToolbarButton
            icon={<Icon name="folder-plus" />}
            title={c('Action').t`Create new folder`}
            onClick={openCreateFolder}
            data-testid="toolbar-new-folder"
        />
    );
};

export default CreateNewFolderButton;
