interface Props {
    selectedIDs: string[];
    labelName: string;
}

const LabelName = ({ selectedIDs = [], labelName }: Props) => {
    return (
        <>
            {selectedIDs.length === 0 && (
                <div className="flex-1">
                    <h2 title={labelName} className="text-lg text-bold text-ellipsis">
                        {labelName}
                    </h2>
                </div>
            )}
        </>
    );
};

export default LabelName;
