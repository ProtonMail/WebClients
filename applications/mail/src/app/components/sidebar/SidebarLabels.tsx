import React from 'react';

import { useLabels } from 'react-components';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import SidebarItem from './SidebarItem';
import EmptyLabels from './EmptyLabels';

interface Props {
    currentLabelID: string;
    counterMap: { [labelID: string]: LabelCount | undefined };
}

const SidebarLabels = ({ currentLabelID, counterMap }: Props) => {
    const [labels = []] = useLabels();

    return (
        <>
            {labels.length ? (
                labels.map((label) => (
                    <SidebarItem
                        key={label.ID}
                        currentLabelID={currentLabelID}
                        labelID={label.ID}
                        icon="circle"
                        iconSize={12}
                        text={label.Name}
                        color={label.Color}
                        isFolder={false}
                        count={counterMap[label.ID]}
                    />
                ))
            ) : (
                <EmptyLabels />
            )}
        </>
    );
};

export default SidebarLabels;
