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
  localStorageService,
  pmcw,
  mailboxIdentifiers,
  tools
) {

  var invertedMailboxIdentifiers = _.invert(mailboxIdentifiers);
  var Message = $resource(
    authentication.baseURL + "/messages/:MessageID",
    authentication.params({ MessageID: "@MessageID" }),
    {
      query: {
        method: "get",
        isArray: true,
        transformResponse: getFromJSONResponse('Messages', true)
      },
      search: {
        method: "get",
        transformResponse: function(data) {
          return angular.fromJson(data);
        },
        url: authentication.baseURL + "/messages/search"
      },
      advSearch: {
        method: "get",
        transformResponse: function(data) {
          return angular.fromJson(data);
        },
        url: authentication.baseURL + "/messages/adv_search"
      },
      delete: {
        method: "delete"
      },
      get: {
        method: "get",
        url: authentication.baseURL + "/messages/:MessageID",
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
      },
      saveDraft: {
        method: "post",
        url: authentication.baseURL + "/messages/draft",
        transformResponse: getFromJSONResponse()
      },
      updateDraft: {
        method: "put",
        url: authentication.baseURL + "/messages/draft"
      },
      send: {
        method: "post",
        url: authentication.baseURL + "/messages",
        headers: {
          'Accept': 'application/vnd.protonmail.api+json;apiversion=2;appversion=1'
        }
      },
      pubkeys: {
        method: 'get',
        url: authentication.baseURL + "/users/pubkeys/:Emails",
        isArray: false,
        transformResponse: getFromJSONResponse()
      },
      // Get all messages with this label
      labels: {
        method: 'get',
        isArray: false,
        transformResponse: function(data) {
          return angular.fromJson(data);
        },
        url: authentication.baseURL + "/label"
      },
      // Apply labels on messages
      apply: {
        method: 'put',
        url: authentication.baseURL + "/labels/apply"
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

    toggleImages: function() {
      this.imagesHidden = !!!this.imagesHidden;
    },

    plainText: function() {
      var body = this._decryptedBody || this.MessageBody;

      return body;
    },

    clearTextBody: function () {
      var body;

      if (this.isDraft() ||
         (!_.isUndefined(this.IsEncrypted) && parseInt(this.IsEncrypted))) {

        if (_.isUndefined(this._decryptedBody)) {
          try {
            var local = localStorageService.get('protonmail_pw');
            var pw = pmcw.decode_base64(local);

            if(!!!this.decrypting) {
              this.decrypting = true;
              pmcw.decryptPrivateKey(authentication.user.EncPrivateKey, pw).then(function(key) {
                  pmcw.decryptMessageRSA(this.MessageBody, key, this.Time).then(function(result) {
                      this._decryptedBody = result;
                      this.failedDecryption = false;
                      this.decrypting = false;
                  }.bind(this));
              }.bind(this));
            }
          } catch(err) {
            this._decryptedBody = "";
            this.failedDecryption = true;
          }
        }

        body = this._decryptedBody;
      } else {
        body = this.MessageBody;
      }

      // Images
      if(angular.isUndefined(this.imagesHidden) || this.imagesHidden === true) {
        this.imagesHidden = true;
        body = tools.breakImages(body);
      } else {
        this.imagesHidden = false;
        body = tools.fixImages(body);
      }

      return body;
    }
  });

  return Message;
})

.factory("User", function(
  $resource,
  $injector){
  var authentication = $injector.get("authentication");
  return $resource(
    authentication.baseURL + "/users/:UserID",
    authentication.params(),
    {
      get: {
        method: 'get',
        isArray: false,
        transformResponse: getFromJSONResponse()
      },
      pubkeys: {
        method: 'get',
        url: authentication.baseURL + "/users/pubkeys/:Emails",
        isArray: true,
        transformResponse: getFromJSONResponse()
      },
      createUser: {
        method: 'post',
        url: authentication.baseURL + "/users"
      },
      updateKeypair: {
        method: 'post',
        url: authentication.baseURL + "/users/key"
      },
      checkUserExist: {
        method: 'get',
        url: authentication.baseURL + "/users/exist"
      },
      checkInvite: {
        method: 'get',
        url: authentication.baseURL + "/users/check/:username"
      },
      getUserStatus: {
        method: 'get',
        url: authentication.baseURL + "/users/status"
      },
      checkResetToken: {
        method: 'get',
        url: authentication.baseURL + "/reset/password/:token",
      },
      resetPassword: {
        method: 'post',
        url: authentication.baseURL + "/reset/password" // update the password
      },
      resetLostPassword: {
        method: 'post',
        url: authentication.baseURL + "/reset/lost-password" //sends notification email to the user
      }
    }
  );
})

.factory("Setting", function($injector, $resource) {
  var authentication = $injector.get("authentication");

  return $resource(
    authentication.baseURL + "/users/:UserID",
    authentication.params(),
    {
      // Update user's password
      updatePassword: {
        method: 'put',
        url: authentication.baseURL + "/setting/password"
      },
      // Update mailbox's password
      keyPassword: {
        method: 'put',
        url: authentication.baseURL + "/setting/keypwd"
      },
      // Update notification email
      notificationEmail: {
        method: 'put',
        url: authentication.baseURL + "/setting/noticeemail"
      },
      // Update signature
      signature: {
        method: 'put',
        url: authentication.baseURL + "/setting/signature"
      },
      // Update aliases
      aliases: {
        method: 'put',
        url: authentication.baseURL + "/setting/domainorder"
      },
      // Update the user's display name
      dislayName: {
        method: 'put',
        url: authentication.baseURL + "/setting/display"
      }
    }
  );
})

.factory("Bug", function($injector, $resource) {
  var authentication = $injector.get("authentication");

  return $resource(
    authentication.baseURL + "/users/:UserID",
    authentication.params(),
    {
      // Send bug report
      bugs: {
        method: 'post',
        url: authentication.baseURL + "/bugs",
        isArray: true
      }
    }
  );
})

.factory("Label", function($resource, $injector) {
  var authentication = $injector.get("authentication");
  return $resource(
    authentication.baseURL + "/labels/:LabelID",
    authentication.params({ LabelID: "@LabelID" }),
    {
      // Get user's labels
      get: {
        method: 'get',
        isArray: true,
        url: authentication.baseURL + "/labels"
      },
      // Get all messages with this label
      messages: {
        method: 'get',
        isArray: false,
        url: authentication.baseURL + "/label"
      },
      // Create a new label
      create: {
        method: 'post',
        url: authentication.baseURL + "/labels/create"
      },
      // Edit label
      edit: {
        method: 'put',
        url: authentication.baseURL + "/labels/edit"
      },
      // Delete label
      delete: {
        method: 'delete'
      }
    }
  );
});
