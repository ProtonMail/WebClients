var getFromJSONResponse = function (name) {
  return function(data) {
    var obj;
    try {
      obj = JSON.parse(data);
    } catch(err) {
      console.error("JSON decoding error:", err, data);
      return {};
    }

    if (!obj.error && name) {
      return obj[name];
    }
    return obj;
  };
};

angular.module("proton.models", [
  "ngResource",
  "proton.authentication"
])

.factory("Contact", function($resource, authentication) {
  var Contact = $resource(
    authentication.baseURL + "/contacts/:ContactID",
    authentication.params({ ContactID: "@ContactID" }), {
    query: {
      method: "get",
      isArray: true,
      transformResponse: function (data) {
        var contacts = JSON.parse(data).Contacts;
        Contact.index.updateWith(contacts);
        return contacts;
      }
    },
    delete: {
      method: "delete",
      isArray: false
    },
    get: {
      method: "get",
      isArray: false,
      transformResponse: function (data) {
        return JSON.parse(data).data;
      }
    },
    update: {
      method: "put",
      isArray: false
    }
  });

  Contact.index = new Bloodhound({
    name: "contacts",
    local: [],
    datumTokenizer: function (datum) {
      return _.union(
        Bloodhound.tokenizers.whitespace(datum.ContactEmail),
        Bloodhound.tokenizers.whitespace(datum.ContactName)
      );
    },
    queryTokenizer: function (datum) {
      return Bloodhound.tokenizers.whitespace(datum);
    }
  });

  _.extend(Contact.index, {
    updateWith: function (list) {
      Contact.index.clear();
      Contact.index.add(list);
    }
  });

  Contact.index.initialize();

  return Contact;
})

.factory("Message", function(
  $resource,
  $rootScope,
  $compile,
  $templateCache,
  $injector,
  authentication,
  crypto,
  mailboxIdentifiers
) {

  var invertedMailboxIdentifiers = _.invert(mailboxIdentifiers);
  var Message = $resource(
    authentication.baseURL + "/messages/:MessageID",
    authentication.params({ MessageID: "@MessageID" }),
    {
      query: {
        method: "get",
        isArray: true,
        transformResponse: getFromJSONResponse('Messages')
      },
      delete: {
        method: "delete"
      },
      get: {
        method: "get",
        transformResponse: getFromJSONResponse()
      },
      patch: {
        method: "put",
        url: authentication.baseURL + "/messages/:MessageID/:action"
      },
      count: {
        method: "get",
        url: authentication.baseURL + "/messages/count",
        transformResponse: getFromJSONResponse('MessageCount')
      }
    }
  );

  // TODO: make that multilingual
  Message.REPLY_PREFIX = /re:/i;
  Message.FORWARD_PREFIX = /fw:/i;

  _.extend(Message, {
    reply: function (base) {
      var message = base.cite();
      message.RecipientList = base.Sender;
      message.MessageTitle = (Message.REPLY_PREFIX.test(base.MessageTitle)) ? base.MessageTitle : "Re: " + base.MessageTitle;

      return message;
    },
    replyall: function (base) {
      var message = base.cite();
      message.RecipientList = [base.Sender, base.CCList, base.BCCList].join(",");
      message.MessageTitle = (Message.REPLY_PREFIX.test(base.MessageTitle)) ? base.MessageTitle : "Re: " + base.MessageTitle;
      return message;
    },
    forward: function (base) {
      var message = base.cite();
      message.MessageTitle = (Message.FORWARD_PREFIX.test(base.MessageTitle)) ? base.MessageTitle : "Fw: " + base.MessageTitle;
      return message;
    }
  });

  _.extend(Message.prototype, {
    readableTime: function() {
      return this.moment().format('LL');
    },
    longReadableTime: function () {
      var dt = this.moment();
      return dt.format('LLL') + " (" + dt.fromNow() + ")";
    },
    moment: function () {
      if (!this._moment) {
        var time = this.Time;
        if (_.isString(time)) {
          time = parseInt(time);
        }
        this._moment = moment.unix(time);
      }
      return this._moment;
    },
    toggleStar: function() {
      this.Tag = this.Tag === "starred" ? "" : "starred";
      return this.$patch({ action: this.Tag == 'starred' ? "star" : "unstar" });
    },
    moveTo: function(location) {
      // If location is given as a name ('inbox', 'sent', etc), convert it to identifier (0, 1, 2)
      if ( _.has(mailboxIdentifiers, location) ) {
        this.Location = mailboxIdentifiers[location];
      } else {
        this.Location = location;
      }

      return this.$patch({ action : invertedMailboxIdentifiers[this.Location] });
    },
    setReadStatus: function (status) {
      this.IsRead = + status;
      $rootScope.unreadCount = $rootScope.unreadCount + (status ? -1 : 1);
      return this.$patch({ action: status ? "read" : "unread" });
    },
    delete: function() {
      return this.$delete();
    },
    numberOfAttachments: function () {
      return this.AttachmentIDList.split(",").length;
    },
    location: function () {
      return invertedMailboxIdentifiers[this.Location];
    },

    isDraft: function () {
      return this.Location == mailboxIdentifiers.drafts;
    },

    cite: function () {
      var message = new Message();
      var baseBody = this.clearTextBody();

      try {
        var _baseBody = $(baseBody);
        if (_baseBody.find("body").length > 0) {
          baseBody = _baseBody.find("body");
        }
      } catch (err) {}

      var citeBody = $("<blockquote type=\"cite\">").append(baseBody);
      var citation = $("<div class=\"moz-cite-prefix\">On " +
          this.moment().format("l, LT") + ", " +
          this.SenderName + " wrote:<br><br></div>");

      var signature = $("<div class=\"signature\">" + authentication.user.Signature + "</div>");

      message.MessageBody = $("<div>").append("<br><br>").append(citation).append(citeBody).append(signature).html();
      message.IsEncrypted = '0';
      return message;
    },

    clearTextBody: function () {
      var body;
      if (this.isDraft() ||
         (!_.isUndefined(this.IsEncrypted) && parseInt(this.IsEncrypted))) {

        if (_.isUndefined(this._decryptedBody)) {
          try {
            this._decryptedBody = crypto.decryptPackage(
              authentication.user.EncPrivateKey,
              this.MessageBody,
              this.Time
            );
            this.failedDecryption = false;
          } catch(err) {
            this._decryptedBody = "";
            this.failedDecryption = true;
          }
        }

        body = this._decryptedBody;
      } else {
        body = this.MessageBody;
      }
      return body;
    }
  });

  return Message;
})

.factory("User", function($resource, $injector) {
  var authentication = $injector.get("authentication");
  return $resource(authentication.baseURL + "/users/:UserID", authentication.params(), {
    get: {
      method: 'get',
      isArray: false,
      transformResponse: getFromJSONResponse()
    }
  });
});
