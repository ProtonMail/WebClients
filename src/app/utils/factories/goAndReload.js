/* @ngInject */
function goAndReload($state) {
    return (stateName = '') => {
        const { url = '' } = $state.get(stateName);

        if (url) {
            window.location.href = url;
            window.location.reload(true);
        }
    };
}
export default goAndReload;
