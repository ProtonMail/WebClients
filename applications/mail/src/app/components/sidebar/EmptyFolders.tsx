import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    useModalState,
} from '@proton/components';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';

interface Props {
    onFocus: () => void;
}

const EmptyFolders = ({ onFocus }: Props) => {
    const [editLabelProps, setEditLabelModalOpen] = useModalState();

    return (
        <SidebarListItem>
            <SidebarListItemButton
                onFocus={onFocus}
                data-shortcut-target="add-folder"
                onClick={() => setEditLabelModalOpen(true)}
            >
                <SidebarListItemContent
                    right={<SidebarListItemContentIcon name="plus" />}
                    title={c('Title').t`Create a new folder`}
                >
                    {c('Link').t`Add folder`}
                </SidebarListItemContent>
            </SidebarListItemButton>
            <EditLabelModal type="folder" {...editLabelProps} />
        </SidebarListItem>
    );
};

export default EmptyFolders;
