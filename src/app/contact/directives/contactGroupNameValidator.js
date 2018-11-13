/* @ngInject */
function contactGroupNameValidator(contactGroupModel) {
    return {
        require: 'ngModel',
        link(scope, el, { contactGroupNameValidator }, ngModel) {
            if (contactGroupNameValidator === 'contactGroup') {
                ngModel.$validators.duplicateGroup = (modelValue) => {
                    if (!modelValue) {
                        return true;
                    }
                    return !contactGroupModel.readName(modelValue);
                };
            }
        }
    };
}
export default contactGroupNameValidator;
