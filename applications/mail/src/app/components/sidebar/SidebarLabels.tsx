import React from 'react';
import { useLabels } from 'react-components';
import SidebarItem from './SidebarItem';

interface Props {
    currentLabelID: string;
    isConversation: boolean;
}

const SidebarLabels = ({ currentLabelID, isConversation }: Props) => {
    const [labels = []] = useLabels();

    return (
        <>
            {labels.map((label) => (
                <SidebarItem
                    key={label.ID}
                    currentLabelID={currentLabelID}
                    labelID={label.ID}
                    icon="label"
                    text={label.Name}
                    color={label.Color}
                    isFolder={false}
                    isConversation={isConversation}
                />
            ))}
        </>
    );
};

export default SidebarLabels;
