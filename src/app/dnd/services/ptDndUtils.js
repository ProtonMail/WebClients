import { isElement } from '../../../helpers/domHelper';
import { uniqID } from '../../../helpers/string';

/* @ngInject */
function ptDndUtils() {
    /**
     * Generate a uniq identifier from 6/7 to 11 caracters (90% between 9 and 11)
     * @param  {String} key prefix
     * @return {String}
     */
    function generateUniqId(key = 'drag-') {
        return `${key}${uniqID()}`;
    }

    /**
     * Try to find the node that initiate the dragEvent
     * @param  {Node} node the event.target node
     * @return {Node}      the found node or null
     */
    function getDragInitiatorNode(node) {
        let currentNode = node;
        while (currentNode.parentNode) {
            if (isElement(currentNode) && currentNode.getAttribute('draggable') === 'true') {
                return currentNode;
            }
            currentNode = currentNode.parentNode;
        }
        return null;
    }

    return { generateUniqId, getDragInitiatorNode };
}
export default ptDndUtils;
