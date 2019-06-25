/* @ngInject */
function bugModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/bug.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            // We want to keep 3 empty lines before the content if it's a debug stack
            const description = (params.form.Description || '').trim();
            this.form = {
                ...params.form,
                Description: `${description}\n\n\n ${params.content || ''}`.trim()
            };

            this.submit = () => console.log(this.form) || params.submit(this.form);
        }
    });
}
export default bugModal;
