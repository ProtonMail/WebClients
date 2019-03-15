import _ from 'lodash';

import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function searchModel(addressesModel, gettextCatalog, labelsModel, translator) {
    const I18N = translator(() => ({
        ALL: gettextCatalog.getString('All', null, 'Option for search panel'),
        FOLDER: {
            inbox: gettextCatalog.getString('Inbox', null, 'Option for search panel'),
            spam: gettextCatalog.getString('Spam', null, 'Option for search panel'),
            drafts: gettextCatalog.getString('Drafts', null, 'Option for search panel'),
            starred: gettextCatalog.getString('Starred', null, 'Option for search panel'),
            allDrafts: gettextCatalog.getString('Drafts', null, 'Option for search panel'),
            sent: gettextCatalog.getString('Sent', null, 'Option for search panel'),
            allSent: gettextCatalog.getString('Sent', null, 'Option for search panel'),
            trash: gettextCatalog.getString('Trash', null, 'Option for search panel'),
            archive: gettextCatalog.getString('Archive', null, 'Option for search panel'),
            allmail: gettextCatalog.getString('All Mail', null, 'Option for search panel')
        }
    }));
    const LIST_LOCATIONS = Object.keys(MAILBOX_IDENTIFIERS).reduce(
        (acc, label) => {
            if (label !== 'search' && label !== 'label') {
                const value = MAILBOX_IDENTIFIERS[label];
                acc.push({ value, label: I18N.FOLDER[label], group: 'folder' });
            }
            return acc;
        },
        [
            {
                value: -1,
                label: I18N.ALL,
                group: 'default'
            }
        ]
    );

    const getFolderList = () => {
        const list = _.map(labelsModel.get(), ({ ID: value, Name: label, Exclusive }) => ({
            value,
            label,
            group: Exclusive === 1 ? 'folder' : 'label'
        }));
        return LIST_LOCATIONS.concat(list);
    };

    const getAddresses = () => {
        return [
            {
                Email: I18N.ALL,
                ID: undefined,
                Order: 0,
                Receive: 1,
                Status: 1
            }
        ].concat(addressesModel.get());
    };

    /**
     * Generate an special Object to reset $stateParams values
     * @return {Object}
     */
    const resetParameters = () => ({
        address: undefined,
        page: undefined,
        filter: undefined,
        sort: undefined,
        label: undefined,
        from: undefined,
        to: undefined,
        subject: undefined,
        keyword: undefined,
        begin: undefined,
        end: undefined,
        attachments: undefined,
        wildcard: undefined,
        starred: undefined,
        reload: undefined
    });

    const extractDate = (model) => {
        if (!model) {
            return;
        }
        if (model instanceof Date) {
            return Math.abs(+model / 1000);
        }
        return Math.abs(+model);
    };

    const getLabel = (folder) => {
        if (folder !== null && angular.isDefined(folder)) {
            return folder.value !== -1 ? folder.value : undefined;
        }
    };

    /**
     * Format date interval
     * If both date are equal (we selected the same day) we
     * will return
     *     - begin = 0:00
     *     - end = 23:59
     * @param  {Number} options.begin
     * @param  {Number} options.end
     * @return {Object}
     */
    const dateInterval = ({ begin, end }) => {
        if (begin && begin === end) {
            return { begin, end: end + (24 * 3600 - 1) };
        }
        return { begin, end };
    };

    const build = (data = {}) => {
        const model = angular.copy(data);
        const attachments = +model.attachments;
        const wildcard = +model.wildcard;
        const date = dateInterval({
            begin: extractDate(model.begin),
            end: extractDate(model.end)
        });

        return {
            ...resetParameters(),
            to: model.to,
            from: model.from,
            keyword: model.keyword,
            wildcard: isNaN(wildcard) ? undefined : wildcard,
            attachments: isNaN(attachments) ? undefined : attachments,
            address: (model.address || {}).ID,
            label: model.label || getLabel(model.folder),
            ...date
        };
    };

    return { getFolderList, getAddresses, resetParameters, build };
}
export default searchModel;
