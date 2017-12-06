/* @ngInject */
function readableTime() {
    // Jan 17, 2016
    return (time) => {
        const m = moment.unix(time);

        if (m.isSame(moment(), 'day')) {
            return m.format('LT');
        }

        return m.format('ll');
    };
}
export default readableTime;
