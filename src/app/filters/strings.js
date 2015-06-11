angular.module("proton.filters.strings",[])

.filter("capitalize", function() {
    return function(input) {
        if (input!==null) {
            input = input.toLowerCase();
        }
        return input.substring(0,1).toUpperCase()+input.substring(1);
    };
})

// unused
.filter('purify', function($sce) {
    // var dirty = $sce.trustAsHtml(value);
    // var config = {
    //     ALLOWED_TAGS: ['a', 'img', 'p', 'div', 'table', 'tr', 'td', 'tbody', 'thead'],
    //     ALLOWED_ATTR: ['style', 'href'],
    //     // KEEP_CONTENT: false, // remove content from non-white-listed nodes too
    //     // RETURN_DOM: false // return a document object instead of a string
    // };
    // return function(value) {
    //     return dirty;
    //     // return DOMPurify.sanitize(dirty);
    // };
    // var c = {
    //     ALLOWED_TAGS: ['b', 'q'], 
    //     ALLOWED_ATTR: ['style']
    // };
    // getTrustedHtml
    // trustAsHtml
    return function(value) {
        return $sce.trustAsHtml(value);
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
    };
})

.filter("username", function() {
    return function(input) {
        var username;
        if (typeof input === "object") {
            if (input.Name!=='') {
                username = input.Name;
            }
            else {
                var firstEmail = input.Address[0];
                chunks = firstEmail.split('@');
                username = chunks[0];
            }
        }
        else if (typeof input === "string") {
            username = input;
        }
        else {
            username = "";
        }
        // console.log(username);
        return username;
    };
})

.filter("humanSize", function () {
    return function (input, withoutUnit) {
        var bytes;
        var unit = "";
        var kb = 1024;
        var mb = kb*1000;
        var gb = mb*1000;

        if (_.isNumber(input)) {
            bytes = input;
        } 
        else if (_.isNaN(bytes = parseInt(input))) {
            bytes = 0;
        }

        if (bytes < kb) {
            if (!!!withoutUnit) {
                unit = " B";
            }
            return (bytes + unit);
        } 
        else if (bytes < mb) {
            if (!!!withoutUnit) {
                unit = " KB";
            }
            return (Math.round(bytes/1024/10).toFixed(2) + unit);
        }  
        else if (bytes < gb) {
            if (!!!withoutUnit) {
                unit = " MB";
            }
            return (Math.round(bytes/1024/1000).toFixed(2) + unit);
        } 
        else {
            if (!!!withoutUnit) {
                unit = " GB";
            }
            return (Math.round(bytes/1024/1000000).toFixed(2) + unit);
        }

    };
})

.filter("contrast", function () {
    return function (input, character) {
        if (!input) {
            return input;
        }

        var split = input.split(character);

        if (split.length === 1) {
            return "*" + input + "*";

        } else {
            if (character === '<') {
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

        for (var i=1; i<range; i++) {
            val.push(i);
        }

        return val;
    };
});
