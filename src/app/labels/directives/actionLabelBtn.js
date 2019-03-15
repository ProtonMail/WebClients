import { LABEL_TYPE } from '../../constants';

/* @ngInject */
function actionLabelBtn(
    manageLabels,
    gettextCatalog,
    contactGroupModel,
    labelsModel,
    networkActivityTracker,
    manageContactGroupModal,
    userType,
    translator,
    manageContactGroup
) {
    const I18N = translator(() => ({
        edit: gettextCatalog.getString('Edit', null, 'Action'),
        remove: gettextCatalog.getString('Delete', null, 'Action')
    }));

    const getType = (key) => (key === 'group' ? LABEL_TYPE.CONTACT_GROUP : LABEL_TYPE.MESSAGE);

    const remove = async (model, type) => {
        const allowed = await manageLabels.remove(model, type);

        if (!allowed) {
            return;
        }

        if (type === LABEL_TYPE.MESSAGE) {
            return labelsModel.remove([model.ID]);
        }
        return contactGroupModel.remove([model.ID]);
    };

    const edit = async (model, type) => {
        if (type === LABEL_TYPE.MESSAGE) {
            return labelsModel.load(true);
        }

        if (!userType().isFree) {
            manageContactGroup.edit(model, null, manageContactGroupModal);
        }
    };

    return {
        scope: {
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/actionLabelBtn.tpl.html'),
        link(scope, el, { action = 'edit', key }) {
            const type = getType(key);
            el[0].textContent = I18N[action];

            const onClick = (e) => {
                e.preventDefault();
                scope.$applyAsync(() => {
                    action === 'remove' && remove(scope.model, type);
                    action === 'edit' && edit(scope.model, type);
                });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default actionLabelBtn;
