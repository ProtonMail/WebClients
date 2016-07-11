angular.module('proton.service.message', [])
  .factory('messageBuilder', function(gettextCatalog, tools, authentication, Message, $filter) {

    var RE_PREFIX = gettextCatalog.getString('Re:', null);
    var FW_PREFIX = gettextCatalog.getString('Fw:', null);
    var RE_LENGTH = RE_PREFIX.length;
    var FW_LENGTH = FW_PREFIX.length;

    function formatSubject(subject, prefixSubject) {
      var prefix = prefixSubject || RE_PREFIX;
      var sub = subject || '';
      var hasPrefix = sub.toLowerCase().substring(0, prefix) === prefix.toLowerCase();

      return hasPrefix ? sub : (prefix + ' ' + subject);
    }

    /**
     * Format and build a reply
     * @param  {Message} newMsg          New message to build
     * @param  {String} options.Subject from the current message
     * @param  {String} options.ToList  from the current message
     * @param  {String} options.ReplyTo from the current message
     * @param  {Number} options.Type    from the current message
     */
    function reply(newMsg, currentMsg) {

      var origin = currentMsg || {};

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
    function replyAll(newMsg, currentMsg) {

      var origin = currentMsg || {};

      newMsg.Action = 1;
      newMsg.Subject = formatSubject(origin.Subject);

      if(origin.Type === 2 || origin.Type === 3) {
        newMsg.ToList = origin.ToList;
        newMsg.CCList = origin.CCList;
        newMsg.BCCList = origin.BCCList;
      } else {
        newMsg.ToList = [origin.ReplyTo];
        newMsg.CCList = _.union(origin.ToList, origin.CCList);

        // Remove user address in CCList and ToList
       var userAddresses = _(authentication.user.Addresses)
        .map(function (adr) {
          return adr.Email;
        });

        newMsg.ToList = _.filter(newMsg.ToList, function (contact) {
          return userAddresses.indexOf(contact.Address) === -1;
        });

        newMsg.CCList = _.filter(newMsg.CCList, function (contact) {
           userAddresses.indexOf(contact.Address) === -1;
        });
      }
    }

    /**
     * Format and build a forward
     * @param  {Message} newMsg          New message to build
     * @param  {String} options.Subject from the current message
     */
    function forward(newMsg, currentMsg) {

      var origin = currentMsg || {};

      newMsg.Action = 2;
      newMsg.ToList = [];
      newMsg.Subject = formatSubject(origin.Subject, FW_PREFIX);
    }

    /**
     * Find the from origin
     * @param  {Array} options.ToList    From the new message
     * @param  {Array} options.CCList    From the new message
     * @param  {Array} options.BCCList   From the new message
     * @param  {String} options.AddressID From the current message
     * @return {String}
     */
    function findFrom(msg, currentMsg) {

      var newMsg = msg || {};
      var origin = currentMsg || {};

      var recipients = _.union(newMsg.ToList, newMsg.CCList, newMsg.BCCList);
      var adr = _.findWhere(authentication.user.Addresses, {ID: origin.AddressID}) || {};

      if (origin.Type !== 2 && origin.Type !== 3) {
        var found = _.findWhere(recipients, {Address: adr.Email});

        _.each(_.sortBy(authentication.user.Addresses, 'Send'), function (address) {
          if (found) {
            return false;
          }

          found = _.findWhere(recipients, {Address: address.Email});
        });

        return (found || adr);
      }

      return adr;
    }

    /**
     * Create a new message
     * @param  {String} action   reply|replyAll|forward
     * @param  {Message} original Current message to reply etc.
     * @return {Message}          New message formated
     */
    function create(action, original) {

      var newMsg = new Message();
      var currentMsg = original || {};
      var subject = DOMPurify.sanitize('Subject: ' + currentMsg.Subject + '<br>');
      var cc = tools.contactsToString(Array.isArray(currentMsg.CCList) ? currentMsg.CCList : [currentMsg.CCList]);

      (action === 'reply') && reply(newMsg, currentMsg);
      (action === 'replyall') && replyAll(newMsg, currentMsg);
      (action === 'forward') && forward(newMsg, currentMsg);

      if (currentMsg.AddressID) {
        newMsg.From = findFrom(newMsg, currentMsg);
      }

      newMsg.ParentID = currentMsg.ID;
      newMsg.Body = [
        '<blockquote class="protonmail_quote" type="cite">',
        '-------- Original Message --------<br>',
        subject,
        'Local Time: ' + $filter('localReadableTime')(currentMsg.Time) + '<br>',
        'UTC Time: ' + $filter('utcReadableTime')(currentMsg.Time) + '<br>',
        'From: ' + currentMsg.Sender.Address + '<br>',
        'To: ' + tools.contactsToString(currentMsg.ToList) + '<br>',
        (cc.length ? cc + '<br>': '') + '<br>',
        (currentMsg.decryptedBody || currentMsg.Body),
        '</blockquote><br>'
      ].join('');

      return newMsg;
    }

    return {create: create};
  });