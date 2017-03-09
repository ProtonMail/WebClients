angular.module('proton.settings')
    .factory('dashboardOptions', (CONSTANTS) => {

        const options = {
            space: _.range(5, 21).map((size, index) => ({
                index,
                label: `${size} GB`,
                value: size * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE
            })),
            domain: _.range(1, 11).map((value, index) => ({
                index, value,
                label: `${value}`
            })),
            address: _.range(5, 55, 5).map((value, index) => ({
                index, value,
                label: `${value}`
            })),
            member: _.range(2, 11).map((value, index) => ({
                index, value,
                label: `${value}`
            }))
        };

        options.businessSpace = options.space.slice(5).map((item, i) => (item.index = i, item));

        const get = (key) => options[key];

        return { get };
    });
