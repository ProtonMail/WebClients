import _ from 'lodash';

/* @ngInject */
function datetimeErrorCombiner() {
    function create(timePickerKey, scope) {
        return () => {
            const dateErrors = Object.keys(scope.form[scope.datePickerKey].$error);
            const timeErrors = timePickerKey in scope.form ? Object.keys(scope.form[timePickerKey].$error) : [];

            const both = _.map(_.intersection(dateErrors, timeErrors), (k) => 'both_' + k);
            const date = _.map(_.difference(dateErrors, timeErrors), (k) => 'date_' + k);
            const time = _.map(_.difference(timeErrors, dateErrors), (k) => 'time_' + k);
            return _.reduce(
                both.concat(time, date),
                (o, c) => {
                    o[c] = true;
                    return o;
                },
                {}
            );
        };
    }

    return { create };
}
export default datetimeErrorCombiner;
