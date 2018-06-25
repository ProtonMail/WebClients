import _ from 'lodash';

/* @ngInject */
function searchValue($stateParams) {
    const toUnixTimestamp = (value = '') => moment(value).unix();
    const formatDate = (value) => moment.unix(value).format('YYYYMMDD');

    /**
     * Convert search string into an array [key,value,key,value etc.]
     * @param  {String} input
     * @return {Array}
     */
    const getList = (input = '') => {
        // must start with the keyword or having a space as prefix
        const list = input.split(/(?: |^)(keyword|from|to|in|begin|end):/g);
        !list[0] && list.shift();
        return list;
    };

    /**
     * Return parameters from String
     * @return {Object}
     */
    const extractParameters = (value = '', folders = []) => {
        /*
            Build object based on the previous key and the current value
            ex: keyword: from:robert@pm.me => { from: robert@pm.me }
         */
        const config = getList(value).reduce((acc, value, i, arr) => {
            const modulo = i % 2; // [key, value, key, value...]
            const prevKey = arr[i - 1];
            const key = prevKey === 'in' ? 'label' : prevKey;
            modulo === 1 && value && (acc[key] = value);
            return acc;
        }, {});

        if (config.label) {
            const folder = _.find(folders, { label: config.label });
            folder && (config.label = folder.value);
            !folder && delete config.label;
        }

        config.end && (config.end = toUnixTimestamp(config.end));
        config.begin && (config.begin = toUnixTimestamp(config.begin));

        if (!Object.keys(config).length && value.length > 0) {
            config.keyword = value;
        }

        return config;
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
