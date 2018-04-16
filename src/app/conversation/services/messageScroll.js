import _ from 'lodash';

/* @ngInject */
function messageScroll() {
    /**
     * Scroll to a custom message inside a conversation
     * @param  {Integer} index       Message Position
     * @param  {Node} nodeMessage
     * @return {void}
     */
    function scroll(index, nodeMessage) {
        const $header = document.getElementById('conversationHeader');
        const $thread = document.getElementById('pm_thread');

        // First one fix scroll to the top
        if (index === 0) {
            return $($thread).animate({ scrollTop: 0 }, 200);
        }

        const node = nodeMessage || document.getElementById(`message${index}`);
        const previous = document.getElementById(`message${index - 1}`);

        const headerOffset = $header ? $header.getBoundingClientRect().top + $header.offsetHeight : 0;
        const amountScrolled = $thread ? $thread.scrollTop : 0;
        const paddingTop = ~~$thread.style.paddingTop.replace('px', '');
        const summaryHeight = document.getElementsByClassName('summary')[0].getBoundingClientRect().height;
        const messageMargin = 10;

        let scrollTop = node ? node.getBoundingClientRect().top + amountScrolled - headerOffset - paddingTop : 0;

        scrollTop -= index === 1 || previous.classList.contains('open') ? summaryHeight / 2 + messageMargin : 1.5 * summaryHeight + 2 * messageMargin;

        $($thread).animate({ scrollTop }, 200);
    }

    /**
     * Scroll to a message by its ID
     * @param  {String} ID   MessageID
     * @param  {Array}  list List of messages inside the conversation
     * @return {void}
     */
    const toID = (ID, list = []) => scroll(_.findIndex(list, { ID }));

    /**
     * Scroll to a message based on its config and its position inside a list
     * @param  {Integer} options.index
     * @param  {Node} options.node (no-required)
     * @return {Object}
     */
    const to = ({ index, node }) => {
        scroll(index, node);
    };

    return { to, toID };
}
export default messageScroll;
