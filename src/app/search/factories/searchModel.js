angular.module('proton.search')
    .factory('searchModel', (authentication, CONSTANTS, gettextCatalog, labelsModel) => {

        const LIST_LOCATIONS = _.reduce(Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS), (acc, label) => {
            if (label !== 'search' && label !== 'label') {
                const value = CONSTANTS.MAILBOX_IDENTIFIERS[label];
                acc.push({ value, label, group: 'folder' });
            }
            return acc;
        }, [{
            value: -1,
            label: gettextCatalog.getString('All', null),
            group: 'default'
        }]);

        const getFolderList = () => {
            const list = _.map(labelsModel.get(), ({ ID: value, Name: label, Exclusive }) => ({
                value, label,
                group: (Exclusive === 1) ? 'folder' : 'label'
            }));
            return LIST_LOCATIONS.concat(list);
        };

        const getAddresses = () => {
            return [{
                Email: gettextCatalog.getString('All', null),
                ID: undefined,
                Send: 0,
                Receive: 1,
                Status: 1
            }].concat(authentication.user.Addresses);
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
            return Math.abs(+model / 1000);
        };

        const getLabel = (folder) => {
            if (folder !== null && angular.isDefined(folder)) {
                return folder.value !== -1 ? folder.value : undefined;
            }
        };

        const build = (data = {}) => {
            const model = angular.copy(data);
            const attachments = +model.attachments;
            const wildcard = +model.wildcard;
            const date = {
                begin: extractDate(model.begin),
                end: extractDate(model.end)
            };

            return _.extend(resetParameters(), {
                to: model.to,
                from: model.from,
                keyword: model.keyword,
                wildcard: isNaN(wildcard) ? undefined : wildcard,
                attachments: isNaN(attachments) ? undefined : attachments,
                address: (model.address || {}).ID,
                label: model.label || getLabel(model.folder)
            }, date);
        };

        return { getFolderList, getAddresses, resetParameters, build };
    });
