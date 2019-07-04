import CONFIG from '../../config';

/* @ngInject */
function releaseNoteModal(pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/releaseNotes.tpl.html'),
        /* @ngInject */
        controller: function() {
            this.articleLink = CONFIG.articleLink;
            this.dateVersion = CONFIG.date_version;
            this.appVersion = CONFIG.app_version;
            this.changelogPath = CONFIG.changelogPath;
        }
    });
}

export default releaseNoteModal;
