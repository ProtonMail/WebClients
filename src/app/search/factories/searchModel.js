angular.module('proton.search')
    .factory('searchModel', (authentication, CONSTANTS, gettextCatalog) => {

        const getFolderList = () => {
            const list = _.reduce(Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS), (acc, label) => {
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

            if (Object.keys(authentication.user).length > 0) {
                _.each(authentication.user.Labels, ({ ID, Name }) => {
                    list.push({ value: ID, label: Name, group: 'label' });
                });
            }
            return list;
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
            const date = {
                begin: extractDate(model.begin),
                end: extractDate(model.end)
            };

            return _.extend(resetParameters(), {
                to: model.to,
                from: model.from,
                keyword: model.keyword,
                attachments: isNaN(attachments) ? undefined : attachments,
                address: (model.address || {}).ID,
                label: getLabel(model.folder)
            }, date);
        };


        return { getFolderList, getAddresses, resetParameters, build };
    });
