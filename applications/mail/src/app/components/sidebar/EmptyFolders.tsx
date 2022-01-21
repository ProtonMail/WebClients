import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContentIcon,
    SidebarListItemContent,
    LabelModal,
    useModals,
} from '@proton/components';

interface Props {
    onFocus: () => void;
}

const EmptyFolders = ({ onFocus }: Props) => {
    const { createModal } = useModals();

    const handleClick = () => {
        createModal(<LabelModal type="folder" />);
    };

    return (
        <SidebarListItem>
            <SidebarListItemButton onFocus={onFocus} data-shortcut-target="add-folder" onClick={handleClick}>
                <SidebarListItemContent
                    right={<SidebarListItemContentIcon name="plus" color="white" />}
                    title={c('Title').t`Create a new folder`}
                >
                    {c('Link').t`Add folder`}
                </SidebarListItemContent>
            </SidebarListItemButton>
        </SidebarListItem>
    );
};

export default EmptyFolders;
