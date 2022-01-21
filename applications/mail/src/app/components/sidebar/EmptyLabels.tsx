import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemButton,
    LabelModal,
    useModals,
    SidebarListItemContentIcon,
} from '@proton/components';
import { randomIntFromInterval } from '@proton/shared/lib/helpers/function';
import { LABEL_COLORS, LABEL_TYPE } from '@proton/shared/lib/constants';

import { Label } from '@proton/shared/lib/interfaces/Label';

interface Props {
    onFocus: () => void;
}

const EmptyLabels = ({ onFocus }: Props) => {
    const { createModal } = useModals();

    const handleClick = () => {
        const newLabel: Pick<Label, 'Name' | 'Color' | 'Type'> = {
            Name: '',
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Type: LABEL_TYPE.MESSAGE_LABEL,
        };
        createModal(<LabelModal label={newLabel} />);
    };

    return (
        <SidebarListItem>
            <SidebarListItemButton onFocus={onFocus} data-shortcut-target="add-label" onClick={handleClick}>
                <SidebarListItemContent
                    right={<SidebarListItemContentIcon name="plus" color="white" />}
                    title={c('Title').t`Create a new label`}
                >
                    {c('Link').t`Add label`}
                </SidebarListItemContent>
            </SidebarListItemButton>
        </SidebarListItem>
    );
};

export default EmptyLabels;
