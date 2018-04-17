/* @ngInject */
function iconAttachment(embedded) {
    const OUTER_MAP_CLASSNAME = {
        zip: 'fa-archive-o',
        mp3: 'fa-audio-o',
        javascript: 'fa-code-o',
        xls: 'fa-excel-o',
        mov: 'fa-movie-o',
        pdf: 'fa-pdf-o',
        power: 'fa-powerpoint-o',
        word: 'fa-word-o'
    };

    const INNER_MAP_CLASSNAME = {
        'pgp-keys': 'fa-key'
    };

    /**
     * Get list of classNames for a file
     * @param  {String} options.MIMEType
     * @return {Array}
     */
    const getFileIconsType = ({ MIMEType }) => {
        return Object.keys(OUTER_MAP_CLASSNAME)
            .filter((key) => MIMEType.includes(key))
            .reduce((acc, key) => (acc.push(OUTER_MAP_CLASSNAME[key]), acc), []);
    };

    /**
     * Get classNames for an attachemnt depending of its status
     * @param  {Object} attachment
     * @return {Array}
     */
    const getAttachmentType = (attachment) => {
        if (embedded.isEmbedded(attachment)) {
            return ['fa-picture-o', 'embedded'];
        }

        const list = ['fa-file-o'];
        attachment.MIMEType.includes('image') && list.push('fa-image-o');
        return list;
    };

    /**
     * Get list of classNames for the inner icon: this allows us to make our icons, by combining fa-file-o with any
     * fontawesome icon
     * @param  {Object} attachment
     * @return {Array}
     */
    const getInnerFileIconTypes = ({ MIMEType }) => {
        return Object.keys(INNER_MAP_CLASSNAME)
            .filter((key) => MIMEType.includes(key))
            .reduce((acc, key) => (acc.push(INNER_MAP_CLASSNAME[key]), acc), []);
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/attachments/iconAttachment.tpl.html'),
        link(scope, el) {
            const outerClassNames = []
                .concat(getAttachmentType(scope.attachment))
                .concat(getFileIconsType(scope.attachment));
            const innerClassNames = getInnerFileIconTypes(scope.attachment);
            const fileOuterIcon = el[0].querySelector('.file-outer-icon');
            const fileInnerIcon = el[0].querySelector('.file-inner-icon');

            _rAF(() => {
                outerClassNames.forEach((className) => fileOuterIcon.classList.add(className));
                innerClassNames.forEach((className) => fileInnerIcon.classList.add(className));
            });
        }
    };
}
export default iconAttachment;
