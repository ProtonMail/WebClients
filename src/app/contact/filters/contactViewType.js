/* @ngInject */
function contactViewType(contactTransformLabel) {
    return (input = '', type) => {
        return contactTransformLabel.toLang(type || input);
    };
}
export default contactViewType;
