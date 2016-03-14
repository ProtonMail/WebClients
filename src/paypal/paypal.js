// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var message = {
    "paymentID": getParameterByName('paymentId'),
    "payerID": getParameterByName('PayerID'),
    "cancel": getParameterByName('cancel')
};

console.log(message);

window.opener.postMessage(message, '*');