/* @ngInject */
function messageTime() {
    return function(time) {
        return moment.unix(time).fromNow();
    };
}
export default messageTime;
