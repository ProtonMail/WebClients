import { queryFilters } from '../api/filters';
import updateCollection from '../helpers/updateCollection';

export const getFiltersModel = (api) => {
    return api(queryFilters()).then(({ Filters }) => Filters);
};

export const FiltersModel = {
    key: 'Filters',
    get: getFiltersModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Filter }) => Filter })
};
