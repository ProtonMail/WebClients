angular.module("proton.crypto", [])

.provider("crypto", function cryptoProvider() {

  var headerMessage = "---BEGIN ENCRYPTED MESSAGE---";
  var tailMessage = "---END ENCRYPTED MESSAGE---";
  var headerRandomKey = "---BEGIN ENCRYPTED RANDOM KEY---";
  var tailRandomKey = "---END ENCRYPTED RANDOM KEY---";

  function pgpEncrypt(randomKey, pubKey) {
    randomKey = encode_utf8_base64(randomKey);
    var _pubKey = openpgp.key.readArmored(pubKey).keys[0];
    return openpgp.encryptMessage([_pubKey], randomKey);
  }

  function pgpDecrypt(encRandomKey, prKey, prKeyPassCode) {
    var _encRandomKey = openpgp.message.readArmored(encRandomKey);
    var _prKey = openpgp.key.readArmored(prKey).keys[0];

    if (_prKey.decrypt(prKeyPassCode)) {
      return decode_utf8_base64(openpgp.decryptMessage(_prKey, _encRandomKey));
    } else {
      return;
    }
  }

  function generateRandomKey() {
    var randomKey = openpgp.crypto.generateSessionKey("aes256");
    return randomKey;
  }

  function encryptMessage(message, randomKey) {

    message = encode_utf8_base64(message);
    // padding
    var residual = message.length % 32;

    if (residual !== 0) {
      for (var i = 0; i < 32 - residual; i++) {
        message = message + ' ';
      }
    }
    var cipher = openpgp.crypto.cfb.encrypt(openpgp.crypto.getPrefixRandom("aes256"), "aes256", message, randomKey, true);
    return encode_utf8_base64(cipher);
  }

  function decryptMessage(time, encMessage, randomKey) {
    encMessage = decode_utf8_base64(encMessage);
    // cuttoff time for enabling multilanguage support
    if (time > 1399086120) {
      return decode_utf8_base64(openpgp.crypto.cfb.decrypt("aes256",randomKey,encMessage,true));
    } else {
      return openpgp.crypto.cfb.decrypt("aes256",randomKey,encMessage,true);
    }
  }

  function generateEmailPkg(encMessage, encRandomKey) {
    var EmailPM = headerMessage + encMessage + tailMessage;
    EmailPM += "||" + headerRandomKey + encRandomKey + tailRandomKey;
    return EmailPM;
  }

  function getEncMessageFromPkg(EmailPM) {
    var begin = EmailPM.search(headerMessage) + headerMessage.length;
    var end = EmailPM.search(tailMessage);
    return EmailPM.substring(begin, end);
  }

  function getEncRandomKeyFromPkg(EmailPM) {
    var begin = EmailPM.search(headerRandomKey) + headerRandomKey.length;
    var end = EmailPM.search(tailRandomKey);
    return EmailPM.substring(begin, end);
  }

  function getHashedPassword(password) {
    var hashed = openpgp.crypto.hash.sha512(password);
    hashed = btoa(hashed);
    return hashed;
  }

  function encode_utf8_base64(data) {
    return btoa(unescape(encodeURIComponent(data))).trim();
  }

  function decode_utf8_base64(data) {
    return decodeURIComponent(escape(atob(data.trim())));
  }

  function getNewEncPrivateKey(prKey, oldMailPwd, newMailPwd) {
    var _prKey = openpgp.key.readArmored(prKey).keys[0];
    if (_prKey.decrypt(oldMailPwd)) {
      _prKey.primaryKey.encrypt(newMailPwd);
      _prKey.subKeys[0].subKey.encrypt(newMailPwd);
      return _prKey.armor();
    }
  }

  var mailboxPassword;

  this.setMailboxPassword = function(pwd) {
    mailboxPassword = pwd;
  };

  this.$get = function() {
    return {
      decryptPackage: function(privateKey, pkg, time) {
        var encryptedMessage = getEncMessageFromPkg(pkg);
        if (!_.isEmpty(encryptedMessage)) {
          var encRandomKey = getEncRandomKeyFromPkg(pkg);
          var randomKey = pgpDecrypt(encRandomKey, privateKey, mailboxPassword);
          return decryptMessage(time, encryptedMessage, randomKey);
        }
      },
      encryptMessageToPackage: function(msg, pubKey) {
        var randomKey = generateRandomKey();

        // encrypt the message
        var encryptedMessageBody = encryptMessage(msg, randomKey);

        // encrypt the random key 256bit
        var encryptedRandomKey = pgpEncrypt(randomKey, pubKey);

        // concat the encrypted message and encrypted random key
        return generateEmailPkg(encryptedMessageBody, encryptedRandomKey);
      },
      encryptMessageForOutside: function (msg, password) {
        // encrypt the message symetrically for outside recipients using the message and a hash of the pw
        return encryptMessage(messageBody, openpgp.crypto.hash.sha256(password));
      },
      encode_base64: function(data)
      {
        return encode_utf8_base64(data);
      },
      setMailboxPassword: function(pubKey, prKey, password) {
        var testMsg = "sPKkm9lk6hSSZ49rRFwg";

        try {

          var encrypted = pgpEncrypt(testMsg, pubKey);
          var decrypted = pgpDecrypt(encrypted, prKey, password);

          if (testMsg === decrypted) {
            mailboxPassword = password;
            return true;
          } else {
            return false;
          }
        } catch (err) {
          return false;
        }
      }
    };
  };
});
