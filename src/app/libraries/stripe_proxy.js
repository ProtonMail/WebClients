
var StripeProxy = function( origin, key ) {
    this.origin = origin;
    this.key = key;

    var iframe = document.createElement('iframe');
    iframe.className = 'stripe_proxy';
    iframe.style = 'display:block; visibility:hidden; width:0; height:0; border:0; border:none;';
    iframe.sandbox = 'allow-scripts allow-same-origin';

    this.ready = new Promise(function(resolve, reject) {
        iframe.onload = function() {
            resolve();
        };
    });

    iframe.src = this.origin+'/stripe.html';
    document.body.appendChild(iframe);

    this.iframe = iframe;
};

StripeProxy.prototype.callSync = function( ) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(true);
    return this.call_.apply(this,args);
};

StripeProxy.prototype.callAsync = function( ) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(false);
    return this.call_.apply(this,args);
};

StripeProxy.prototype.call_ = function( sync ) {

    if ( this.ready === false ) {
        return Promise.reject('Stripe iframe has been cleaned up!');
    }

    var currDate = new Date();
    var requestID = currDate.getTime()+"_"+parseInt(Math.random() * 1000000);
    var args = Array.prototype.slice.call(arguments,1);

    if( !args.length ) {
        return Promise.reject('Must at least provide Stripe function name');
    }

    var iframe = this.iframe;
    var destOrigin = this.origin;
    var key = this.key;

    return this.ready.then(function() {
        return new Promise(function(resolve,reject) {
            var receiveMessage = function(event)
            {
                var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
                if (origin !== destOrigin) {
                    return;
                }

                var data = event.data;
                if ( data.requestID === requestID ) {
                    window.removeEventListener("message", receiveMessage, false);
                    resolve(data.response);
                }
            };

            var message = {
                "key": key,
                "sync": sync,
                "requestID": requestID,
                "args": args
            };

            window.addEventListener("message", receiveMessage, false);

            iframe.contentWindow.postMessage(message, destOrigin);
        });
    });
};

StripeProxy.prototype.cleanup = function() {
    document.body.removeChild(this.iframe);
    this.ready = false;
};

// window.addEventListener("message", receiveMessage, false);

// var stripeData = null;
// function receiveMessage(event)
// {
//     var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
//     if (origin !== window.parent.location.origin) {
//         return;
//     }

//     stripeData = event.data;
//     var script = window.document.createElement('script');

//     script.type= 'text/javascript';
//     script.src = 'https://js.stripe.com/v2/';
//     window.document.body.appendChild(script);

//     if(script.readyState) { // IE
//         script.onreadystatechange = function() {
//             if ( script.readyState === "loaded" || script.readyState === "complete" ) {
//                 script.onreadystatechange = null;
//                 window.Stripe.setPublishableKey(stripeData.key);
//             }
//         };
//     } else { // Others
//         script.onload = function() {
//             window.Stripe.setPublishableKey(stripeData.key);
//         };
//     }
// }

// function mainfunc (func){
//     this[func].apply(this, Array.prototype.slice.call(arguments, 1));
// }

// jQuery(function($) {
//   $('#payment-form').submit(function(event) {

//     var $form = $(this);

//     // Disable the submit button to prevent repeated clicks
//     $form.find('button').prop('disabled', true);

//     Stripe.card.createToken($form, stripeResponseHandler);
//     // Prevent the form from submitting with the default action
//     return false;
//   });
// });

// function stripeResponseHandler(status, response) {
//   var $form = $('#payment-form');
//   if (response.error) {
//     // Show the errors on the form
//     $form.find('.payment-errors').text(response.error.message);
//     $form.find('button').prop('disabled', false);
//   } else {
//     // response contains id and card, which contains additional card details
//     var token = response.id;
//     // Send token
//     var message = {
//         "type": "stripe",
//         "token": token
//     };

//     // if origin issues, use for development:
//     // window.parent.postMessage(message, '*');
//     window.parent.postMessage(message, window.parent.location.origin);
//   }
// };
