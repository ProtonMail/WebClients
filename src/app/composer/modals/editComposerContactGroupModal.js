/* @ngInject */
function editComposerContactGroupModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/composer/editComposerContactGroupModal.tpl.html'),
        /* @ngInject */
        controller: function(params, contactGroupModel, composerContactGroupSelection) {
            const { ID: GroupID } = params.model;
            const cache = composerContactGroupSelection(params.message.ID);
            this.memberNumber = contactGroupModel.getNumberString(GroupID);
            this.model = params.model;
            this.message = params.message;
            const cacheEmails = cache.getDraftConfigGroup(params.type, GroupID);

            this.group = params.group.map((item) => {
                const email = cache.getEmail(GroupID, item) || cacheEmails[item.Email || item.Address];

                // If we have nothing inside the cache = new group so we select everything
                if (email || cache.isEmpty(GroupID)) {
                    return { ...email, ...item, isSelected: true };
                }
                // Default no cache OR not selected
                item.isSelected = false;
                return item;
            });

            this.submit = () => {
                const list = this.group.filter(({ isSelected }) => isSelected);
                cache.save(this.model, list);
                params.close();
            };
        }
    });
}
export default editComposerContactGroupModal;
