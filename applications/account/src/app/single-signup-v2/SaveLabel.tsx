import './SaveLabel.scss';

const SaveLabel = ({ highlightPrice, percent }: { highlightPrice: boolean; percent: number }) => {
    const children = `− ${percent}%`;
    if (highlightPrice) {
        return <span className="text-sm save-label py-0-5 rounded">{children}</span>;
    }
    return <span className="text-sm color-success">{children}</span>;
};

export default SaveLabel;
