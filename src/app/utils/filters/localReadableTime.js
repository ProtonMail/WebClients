/* @ngInject */
function localReadableTime() {
    // January 17, 2016 12:48 pm (locale dependant)
    return function(time) {
        const m = moment.unix(time);
        return m.format('LLLL');
    };
}
export default localReadableTime;
