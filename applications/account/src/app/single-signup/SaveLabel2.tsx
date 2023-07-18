import './SaveLabel2.scss';

const SaveLabel2 = ({ highlightPrice, percent }: { highlightPrice: boolean; percent: number }) => {
    const children = `− ${percent}%`;
    if (highlightPrice) {
        return <span className="text-sm save-label2 py-0-5 color-success rounded-sm">{children}</span>;
    }
    return <span className="text-sm color-success">{children}</span>;
};

export default SaveLabel2;
