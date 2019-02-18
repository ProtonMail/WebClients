/* @ngInject */
function formatBDay() {
    return (dateAndOrTime) => {
        /*
        https://tools.ietf.org/html/rfc6350#section-6.2.5
        Input:
        19961022T140000
        --1022T1400
        ---22T14
        19850412
        1985-04
        1985
        --0412
        ---12
        T102200
        T1022
        T10
        T-2200
        T--00
        T102200Z
        T102200-0800
        */
        const m = moment(dateAndOrTime);

        if (m.isValid()) {
            return m.format('LL');
        }

        return dateAndOrTime;
    };
}
export default formatBDay;
