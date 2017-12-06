/* @ngInject */
function nameRecipient() {
    return (Name = '') => (Name.includes(',') ? `"${Name}"` : Name);
}
export default nameRecipient;
