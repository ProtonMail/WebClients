/* @ngInject */
function goAndReload($state) {
    return (stateName = '') => {
        const { url = '' } = $state.get(stateName);

        if (url) {
            window.location.href = url;
        }
    };
}
export default goAndReload;
