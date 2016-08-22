angular.module('proton.service.message', [])
    .factory('messageBuilder', (gettextCatalog, tools, authentication, Message, $filter, signatureBuilder) => {

        const RE_PREFIX = gettextCatalog.getString('Re:', null);
        const FW_PREFIX = gettextCatalog.getString('Fw:', null);
        const RE_LENGTH = RE_PREFIX.length;
        const FW_LENGTH = FW_PREFIX.length;

        function formatSubject(subject = '', prefix = RE_PREFIX) {
            const newSubject = subject.substring(0, prefix.length);
            const hasPrefix = subject.toLowerCase().indexOf(prefix.toLowerCase()) === 0;

            return hasPrefix ? subject : (prefix + ' ' + subject);
        }

        /**
         * Filter user's adresses
         * @param  {Array}  list
         * @param  {Array}  address UserAdresses
         * @return {Array}
         */
        const filterUserAddresses = (list = [], address = []) => _.filter(list, ({ Address }) => address.indexOf(Address.toLowerCase()) === -1);

        /**
         * Format and build a reply
         * @param  {Message} newMsg          New message to build
         * @param  {String} options.Subject from the current message
         * @param  {String} options.ToList  from the current message
         * @param  {String} options.ReplyTo from the current message
         * @param  {Number} options.Type    from the current message
         */
        function reply(newMsg, origin = {}) {
            newMsg.Action = 0;
            newMsg.Subject = formatSubject(origin.Subject);

            if(origin.Type === 2 || origin.Type === 3) {
                newMsg.ToList = origin.ToList;
            } else {
                newMsg.ToList = [origin.ReplyTo];
            }
        }

        /**
         * Format and build a replyAll
         * @param  {Message} newMsg          New message to build
         * @param  {String} options.Subject from the current message
         * @param  {String} options.ToList  from the current message
         * @param  {String} options.CCList  from the current message
         * @param  {String} options.BCCList from the current message
         * @param  {String} options.ReplyTo from the current message
         * @param  {Number} options.Type    from the current message
         */
        function replyAll(newMsg, { Subject, Type, ToList, ReplyTo, CCList, BCCList } = {}) {

            newMsg.Action = 1;
            newMsg.Subject = formatSubject(Subject);

            if(Type === 2 || Type === 3) {
                newMsg.ToList = ToList;
                newMsg.CCList = CCList;
                newMsg.BCCList = BCCList;
            } else {
                newMsg.ToList = [ReplyTo];
                newMsg.CCList = _.union(ToList, CCList);

                // Remove user address in CCList and ToList
                const userAddresses = _(authentication.user.Addresses).map(({ Email = '' }) => Email.toLowerCase());
                newMsg.CCList = filterUserAddresses(newMsg.CCList, userAddresses);
            }
        }



        /**
         * Format and build a forward
         * @param  {Message} newMsg          New message to build
         * @param  {String} options.Subject from the current message
         */
        function forward(newMsg, { Subject } = {}) {
            newMsg.Action = 2;
            newMsg.ToList = [];
            newMsg.Subject = formatSubject(Subject, FW_PREFIX);
        }

        /**
         * Inject the inline images as attachement for embedded xray()
         * @param {Array} originalAttachements From the current message
         * return {String}
        */
        function injectInline(originalAttachements = {}){
            return _.filter(originalAttachements, function (el) {
                    var disposition = el.Headers["content-disposition"];
                    var inline = new RegExp('^inline', 'i');
                    return inline.test(disposition) === true;
            });
        }

        /**
         * Find the from origin
         * @param  {Array} options.ToList    From the new message
         * @param  {Array} options.CCList    From the new message
         * @param  {Array} options.BCCList   From the new message
         * @param  {String} options.AddressID From the current message
         * @param  {Number} options.Type From the current message
         * @return {String}
         */
        function findFrom({ ToList, CCList, BCCList } = {}, { AddressID, Type } = {}) {

            const recipients = _.union(ToList, CCList, BCCList);
            const adr = _.findWhere(authentication.user.Addresses, {ID: AddressID}) || {};

            if (Type !== 2 && Type !== 3) {
                let found;

                _.each(_.sortBy(authentication.user.Addresses, 'Send'), (address) => {
                    if (found) {
                        return false;
                    }

                    found = _.findWhere(address, {Address: recipients.Address});
                });

                return (found || adr);
            }

            return adr;
        }

        function builder(action, currentMsg = {}, newMsg = {}) {

            const subject = DOMPurify.sanitize('Subject: ' + currentMsg.Subject + '<br>');
            const cc = tools.contactsToString(Array.isArray(currentMsg.CCList) ? currentMsg.CCList : [currentMsg.CCList]);

            (action === 'reply') && reply(newMsg, currentMsg);
            (action === 'replyall') && replyAll(newMsg, currentMsg);
            (action === 'forward') && forward(newMsg, currentMsg);

            if (currentMsg.AddressID) {
                newMsg.AddressID = currentMsg.AddressID;
                newMsg.From = findFrom(newMsg, currentMsg);
            }

            /* add inline images as attachments */
            newMsg.Attachments = injectInline(currentMsg.Attachments);
            newMsg.NumEmbedded = 0;

            newMsg.ParentID = currentMsg.ID;
            newMsg.setDecryptedBody([
                '<blockquote class="protonmail_quote" type="cite">',
                '-------- Original Message --------<br>',
                subject,
                'Local Time: ' + $filter('localReadableTime')(currentMsg.Time) + '<br>',
                'UTC Time: ' + $filter('utcReadableTime')(currentMsg.Time) + '<br>',
                'From: ' + currentMsg.Sender.Address + '<br>',
                'To: ' + tools.contactsToString(currentMsg.ToList) + '<br>',
                (cc.length ? cc + '<br>': '') + '<br>',
                (currentMsg.getDecryptedBody()),
                '</blockquote><br>'
            ].join(''));


            return newMsg;
        }

        /**
         * Find the current sender for a message
         * @param  {String} options.AddressID
         * @return {Object}
         */
        function findSender({ AddressID = '' } = {}) {

            const enabledAddresses = _
                .chain(authentication.user.Addresses)
                .where({ Status: 1 })
                .sortBy('Send')
                .value();

            let sender = enabledAddresses[0];

            if (AddressID) {
                const originalAddress = _.findWhere(enabledAddresses, {ID: AddressID});

                originalAddress && (sender = originalAddress);
            }

            return sender || {};
        }

        /**
         * Bind defaults parameters for a messafe
         * @param {Message} message
         */
        function setDefaultsParams(message) {
            const sender = findSender(message);

            _.defaults(message, {
                Type: 1,
                ToList: [],
                CCList: [],
                BCCList: [],
                Attachments: [],
                numTags: [],
                recipientFields: [],
                Subject: '',
                PasswordHint: '',
                IsEncrypted: 0,
                ExpirationTime: 0,
                From: sender,
                uploading: 0,
                toFocussed: false,
                autocompletesFocussed: false,
                ccbcc: false,
            });
        }


        /**
         * Create a new message
         * @param  {String} action   reply|replyAll|forward
         * @param  {Message} currentMsg Current message to reply etc.
         * @return {Message}          New message formated
         */
        function create(action, currentMsg = {}) {
            let newMsg = new Message();

            setDefaultsParams(newMsg);

            if ('new' !== action) {
                newMsg = builder(action, currentMsg, newMsg);
            }
            newMsg.setDecryptedBody(signatureBuilder.insert(newMsg));
            return newMsg;
        }

        return { create, findSender, updateSignature: signatureBuilder.update };
    });
