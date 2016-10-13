angular.module('proton.conversation')
    .factory('messageScroll', () => {

        let config = {};

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

            const headerOffset = $header ? ($header.getBoundingClientRect().top + $header.offsetHeight) : 0;
            const amountScrolled = $thread ? $thread.scrollTop : 0;
            const paddingTop = ~~$thread.style.paddingTop.replace('px', '');

            let scrollTop = node ? (node.getBoundingClientRect().top + amountScrolled - headerOffset - paddingTop) : 0;

            scrollTop -= ((index === 1) ? 15 : 68);

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
         * @param  {Message} options.message
         * @return {Object}
         */
        const to = ({ index, message }) => {

            // Should we have a promise of scroll ?
            if (config.ID) {
                (config.isScrollable && message.ID === config.ID) && scroll(index);
                return (config = {});
            }

            scroll(index);
        };

        /**
         * When you toggle a message, if you open this message
         * save its config to be able to scroll to this message when
         * its body will be loaded
         * @param  {String}  ID           MessageID
         * @param  {Boolean} isScrollable
         * @return {Object}
         */
        const willScroll = (ID, isScrollable) => config = { ID, isScrollable };
        const hasPromise = () => !!config.ID;

        return { to, toID, willScroll, hasPromise };
    });
