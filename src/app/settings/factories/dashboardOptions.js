angular.module('proton.settings')
    .factory('dashboardOptions', (CONSTANTS) => {

        const spaceBuilder = (start = 5, end = 21) => {
            return _.range(start, end).map((size, index) => ({
                index,
                label: `${size} GB`,
                value: size * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE
            }));
        };

        const options = {
            space: spaceBuilder(),
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

        options.businessSpace = spaceBuilder(10, 21);

        const get = (key) => angular.copy(options[key]);

        return { get };
    });
