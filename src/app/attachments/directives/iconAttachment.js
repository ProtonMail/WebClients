/* @ngInject */
function iconAttachment($compile) {
    const OUTER_MAP_CLASSNAME = {
        zip: 'file-rar-zip',
        mp3: 'file-video',
        javascript: 'file-unknown',
        vcard: 'file-unknown',
        xls: 'file-xls',
        mov: 'file-video',
        pdf: 'file-pdf',
        power: 'file-ppt',
        word: 'file-doc'
    };

    const INNER_MAP_CLASSNAME = {
        'pgp-keys': 'fa-key'
    };

    /**
     * Get list of classNames for a file
     * @param  {String} options.MIMEType
     * @return {String}
     */
    const getFileIconsType = ({ MIMEType }) => {
        const key = Object.keys(OUTER_MAP_CLASSNAME).find((key) => MIMEType.includes(key));
        return OUTER_MAP_CLASSNAME[key];
    };

    /**
     * Get list of classNames for the inner icon: this allows us to make our icons, by combining fa-file-o with any
     * fontawesome icon
     * @param  {Object} attachment
     * @return {Array}
     */
    const getInnerFileIconTypes = ({ MIMEType }) => {
        const key = Object.keys(INNER_MAP_CLASSNAME).find((key) => MIMEType.includes(key));
        return INNER_MAP_CLASSNAME[key];
    };

    const template = (outerIcon = 'file-image', single = true) => {
        const secondIcon = !single ? '<icon data-name="key" class="file-inner-icon"></icon>`' : '';
        const singleClass = single ? 'single' : '';

        return `<icon data-name="${outerIcon}" data-size="20" class="mauto file-outer-icon ${singleClass}"></icon>${secondIcon}`;
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/attachments/iconAttachment.tpl.html'),
        link(scope, el) {
            _rAF(() => {
                const tpl = template(getFileIconsType(scope.attachment), !getInnerFileIconTypes(scope.attachment));
                el.append($compile(tpl)(scope));
            });
        }
    };
}
export default iconAttachment;
