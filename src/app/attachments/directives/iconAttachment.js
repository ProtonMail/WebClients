angular.module('proton.attachments')
    .directive('iconAttachment', (embedded) => {

        const MAP_CLASSNAME = {
            zip: 'fa-archive-o',
            mp3: 'fa-audio-o',
            javascript: 'fa-code-o',
            xls: 'fa-excel-o',
            mov: 'fa-movie-o',
            pdf: 'fa-pdf-o',
            power: 'fa-powerpoint-o',
            word: 'fa-word-o'
        };

        /**
         * Get list of classNames for a file
         * @param  {String} options.MIMEType
         * @return {Array}
         */
        const getFileIconsType = ({ MIMEType }) => {
            return Object
                .keys(MAP_CLASSNAME)
                .filter((key) => MIMEType.includes(key))
                .reduce((acc, key) => (acc.push(MAP_CLASSNAME[key]), acc), []);
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

        return {
            replace: true,
            template: '<i class="fa"></i>',
            link(scope, el) {
                const classNames = []
                    .concat(getAttachmentType(scope.attachment))
                    .concat(getFileIconsType(scope.attachment));

                _rAF(() => {
                    el[0].classList.add(...classNames);
                });
            }
        };
    });
