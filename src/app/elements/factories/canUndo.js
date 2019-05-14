/* @ngInject */
function canUndo(tools, labelsModel) {
    return () => {
        const currentMailbox = tools.currentMailbox();
        const currentLocation = tools.currentLocation();

        if (currentMailbox === 'search') {
            return false;
        }

        if (currentMailbox === 'label') {
            return labelsModel.contains(currentLocation, 'folders');
        }

        return true;
    };
}
export default canUndo;
