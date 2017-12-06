/* @ngInject */
function formIsInvalid() {
    const getClassName = (prefix = '') => `${prefix}-is-invalid`;

    return {
        link(scope, el, { name }) {
            if (!name) {
                throw new Error('A form must contains a name attribute');
            }

            const onSubmit = () => {
                if (scope[name].$invalid) {
                    return el[0].classList.add(getClassName(name));
                }

                el[0].classList.remove(getClassName(name));
            };

            el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
            });
        }
    };
}
export default formIsInvalid;
