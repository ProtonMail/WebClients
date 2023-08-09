import React from 'react';

interface Props {
    selectedIDs: string[];
    labelName: string;
}

const LabelName = ({ selectedIDs = [], labelName }: Props) => {
    return (
        <>
            {selectedIDs.length === 0 && (
                <div className="flex-item-fluid">
                    <h2 title={labelName} className="text-lg text-bold text-ellipsis">
                        {labelName}
                    </h2>
                </div>
            )}
        </>
    );
};

export default LabelName;
