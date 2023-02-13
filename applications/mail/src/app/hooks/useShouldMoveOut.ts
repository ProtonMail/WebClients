interface Props {
    elementID?: string;
    elementIDs: string[];
    onBack: () => void;
    loadingElements: boolean;
}

const useShouldMoveOut = ({ elementID = '', elementIDs, onBack, loadingElements }: Props) => {
    if (loadingElements) {
        return;
    }

    const shouldMoveOut = !elementID || elementIDs.length === 0 || !elementIDs.includes(elementID);

    if (shouldMoveOut) {
        onBack();
    }
};

export default useShouldMoveOut;