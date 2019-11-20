/* @ngInject */
function initials() {
    const getLetter = (name = '') => name.charAt(0).toUpperCase();

    const formatString = (input = '') => {
        const [name, name2 = ''] = input.split(' ');

        if (!name2 || !/^\w/.test(name2)) {
            return getLetter(name);
        }

        // If Emoji ingnore it
        if (!/^\w/.test(name) && name2) {
            return getLetter(name2);
        }

        return `${getLetter(name)}${getLetter(name2)}`;
    };

    /**
     * Extract the sender informations
     *     - Sender if we list messages
     *     - Sender if we list conversations
     * @param  {Object} options.Sender
     * @param  {Array} options.Senders <...Sender>
     * @return {string}
     */
    const formatSender = ({ Sender, Senders: [sender] = [] }) => {
        const { Name = '', Address = '' } = sender || Sender || {};
        return formatString(Name || Address);
    };

    return (input = '') => {
        if (typeof input !== 'string') {
            return formatSender(input);
        }

        return formatString(input);
    };
}
export default initials;
