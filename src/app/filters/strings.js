angular.module("proton.filters.strings", [])

.filter("capitalize", function() {
  return function(input) {
    return _.string.capitalize(input);
  };
})

.filter("humanDuration", function () {
  return function (input, units) {
    var duration = moment.duration(Math.round(input), units);
    var days = duration.days();
    var cmps = [];
    if (days === 1) {
      cmps.push("a day");
    } else if (days > 1) {
      cmps.push(days + " days");
    }

    duration.subtract(days, 'days');
    var hours = duration.hours();
    if (hours === 1) {
      cmps.push("an hour");
    } else if (hours > 1) {
      cmps.push(hours + " hours");
    }
    return cmps.join(" and ");
  }
})

.filter("username", function() {
  return function(input) {
    // single email
    if(input.indexOf(',') === -1) {
      // split email into array
      var username = input.split('@');
      // return everything before the @
      return username[0];
    }
    // email list
    else {
      var emails = input.split(',');
      var usernames = '';
      // loop through all emails
      for (var i = 0; i < emails.length; i++) {
        var username = input.split('@');
        if (i<(emails.length-1)) {
          // append a comma if its not the last
          usernames += username[0]+', ';
        }
        else {
          usernames += username[0];
        }
      }
      return usernames;
    }
  };
})

.filter("humanSize", function () {
  return function (input, withoutUnit) {
    var size;
    var unit = "";

    if (_.isNumber(input)) {
      size = input;
    } else if (_.isNaN(size = parseInt(input))) {
      size = 0;
    }

    if (size < 1024) {
      if(!!!withoutUnit) {
        unit = " B";
      }
      return size + unit;
    } else if (size < 1048576) {
      if(!!!withoutUnit) {
        unit = " KB";
      }
      return Math.round(size*10/1024)/10 + unit;
    } else {
      if(!!!withoutUnit) {
        unit = " MB";
      }
      return Math.round(size*10/1048576)/10 + unit;
    }
  };
})

.filter("contrast", function () {
  return function (input, character) {
    if (!input) {
      return input;
    }

    var split = input.split(character);

    if (split.length == 1) {
      return "*" + input + "*";

    } else {
      if (character == '<') {
        character = '&lt;';
        split[1].replace('>', '&gt;');
      }

      return "*" + _.string.trim(split[0]) + "* " + character + split[1];
    }
  };
})

.filter('range', function() {
  return function(val, range) {
    range = parseInt(range);
    for (var i=1; i<range; i++)
      val.push(i);
    return val;
  };
})