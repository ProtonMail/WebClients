var getFromJSONResponse = function (name) {
  return function(data) {
    var obj = JSON.parse(data);
    if (!obj.error && name) {
      return obj[name];
    }
    return obj;
  };
};

angular.module("proton.Models", [
  "ngResource",
  "proton.Auth"
])

.factory("Contact", function($resource, authentication) {
  return $resource(authentication.baseURL + "/contacts/:ContactID", authentication.params(), {
    query: {
      method: "get",
      isArray: true,
      transformResponse: function (data) {
        return JSON.parse(data).data;
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
    patch: {
      method: "patch",
      isArray: false
    }
  });
})

.factory("Message", function($resource, $rootScope, authentication, crypto, mailboxIdentifiers) {
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

  _.extend(Message.prototype, {
    readableTime: function() {
      return moment.unix(this.Time).format('LL');
    },
    longReadableTime: function () {
      var dt = moment.unix(this.Time);
      return dt.format('LLL') + " (" + dt.fromNow() + ")";
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

    clearTextBody: function () {
      if (parseInt(this.IsEncrypted)) {
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

        return this._decryptedBody;
      } else {
        return this.MessageBody;
      }
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
