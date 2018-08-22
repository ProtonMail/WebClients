/* @ngInject */
function contactViewType(contactTransformLabel) {
    return (input = '', type) => {
        return contactTransformLabel.toLang(input || type);
    };
}
export default contactViewType;
