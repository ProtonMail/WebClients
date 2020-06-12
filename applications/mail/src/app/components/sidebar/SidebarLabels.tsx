import React from 'react';
import { useLabels } from 'react-components';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import SidebarItem from './SidebarItem';

interface Props {
    currentLabelID: string;
    isConversation: boolean;
    counterMap: { [labelID: string]: LabelCount | undefined };
}

const SidebarLabels = ({ currentLabelID, isConversation, counterMap }: Props) => {
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
                    count={counterMap[label.ID]}
                />
            ))}
        </>
    );
};

export default SidebarLabels;
