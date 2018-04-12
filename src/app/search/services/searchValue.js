import _ from 'lodash';

/* @ngInject */
function searchValue($stateParams) {
    const toUnixTimestamp = (value = '') => moment(value).unix();
    const formatDate = (value) => moment.unix(value).format('YYYYMMDD');

    /**
     * Return parameters from String
     * @return {Object}
     */
    const extractParameters = (value = '', folders = []) => {
        const parameters = {};
        const separators = [
            { value: 'keyword:', key: 'keyword' },
            { value: 'from:', key: 'from' },
            { value: 'to:', key: 'to' },
            { value: 'in:', key: 'label' },
            { value: 'begin:', key: 'begin' },
            { value: 'end:', key: 'end' }
        ];

        _.each(separators, (separator) => {
            const tmp = value.split(separator.value);

            _.each(separators, (sep) => {
                if (tmp[1] && tmp[1].indexOf(sep.value) !== -1) {
                    tmp[1] = tmp[1].split(sep.value)[0];
                }
            });

            if (tmp[1]) {
                const tmp1 = tmp[1].trim();

                if (separator.key === 'label') {
                    const folder = _.find(folders, { label: tmp1 });

                    if (angular.isDefined(folder)) {
                        parameters.label = folder.value;
                    }
                } else if (separator.key === 'begin' || separator.key === 'end') {
                    parameters[separator.key] = toUnixTimestamp(tmp1);
                } else {
                    parameters[separator.key] = tmp1;
                }
            }
        });

        if (Object.keys(parameters).length === 0 && value.length > 0) {
            parameters.keyword = value;
        }

        return parameters;
    };

    /**
     * Generate string from parameters set inside the URL
     */
    const generateSearchString = (folders) => {
        let result = '';

        if (angular.isDefined($stateParams.label)) {
            const folder = _.find(folders, { value: $stateParams.label });

            if (angular.isDefined(folder)) {
                result += `in:${folder.label} `;
            }
        }

        if (angular.isDefined($stateParams.keyword)) {
            if (
                angular.isUndefined($stateParams.from) &&
                angular.isUndefined($stateParams.to) &&
                angular.isUndefined($stateParams.label)
            ) {
                result += $stateParams.keyword + ' ';
            } else {
                result += `keyword:${$stateParams.keyword} `;
            }
        } else if (angular.isDefined($stateParams.label)) {
            result += 'keyword: ';
        }

        if (angular.isDefined($stateParams.from)) {
            result += `from:${$stateParams.from} `;
        }

        if (angular.isDefined($stateParams.to)) {
            result += `to:${$stateParams.to} `;
        }

        if (angular.isDefined($stateParams.begin)) {
            result += `begin:${formatDate($stateParams.begin)} `;
        }

        if (angular.isDefined($stateParams.end)) {
            result += `end:${formatDate($stateParams.end)} `;
        }

        return result.trim();
    };

    return { generateSearchString, extractParameters };
}
export default searchValue;
