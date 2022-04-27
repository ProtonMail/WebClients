import { IEditor } from 'roosterjs';

const nodeIsImage = (node: Node): node is HTMLImageElement => node?.nodeName === 'IMG';

const editorSelectionIsImage = (editorInstance: IEditor): HTMLImageElement | undefined => {
    const selectedRegions = editorInstance.getSelectedRegions();
    const startNode = selectedRegions?.[0]?.fullSelectionStart?.node;
    const endNode = selectedRegions?.[0]?.fullSelectionEnd?.node;

    const selectionContainsOneNode = startNode === endNode;
    const hasSelectedImage = nodeIsImage(startNode);

    return selectionContainsOneNode && hasSelectedImage ? startNode : undefined;
};

export default editorSelectionIsImage;
