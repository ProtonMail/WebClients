angular.module("proton.models.eo", [])

.factory("Eo", function($http, authentication, transformRequestAsFormPost) {
    return {
        token: function(tokenID) {
            return $http.get(authentication.baseURL + '/eo/token/' + encodeURIComponent(tokenID), {
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Accept': 'application/vnd.protonmail.v1+json'
                }
            });
        },
        message: function(decrypted_token, token_id) {
            return $http.get(authentication.baseURL + '/eo/message', {
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        },
        attachment: function(decrypted_token, token_id, attachmentID) {
            return $http.get(authentication.baseURL + '/eo/attachment/' + attachmentID, {
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        },
        reply: function(decrypted_token, token_id, data) {
            return $http({
                url: authentication.baseURL + '/eo/reply',
                transformRequest: transformRequestAsFormPost,
                data: data,
                headers: {
                    'Authorization': decrypted_token,
                    'x-eo-uid': token_id
                }
            });
        }
    };
})

.factory(
    "transformRequestAsFormPost",
    function() {

        // I prepare the request data for the form post.
        function transformRequest( data, getHeaders ) {

            var headers = getHeaders();

            headers[ "Content-type" ] = "application/x-www-form-urlencoded; charset=utf-8";

            return( serializeData( data ) );

        }


        // Return the factory value.
        return( transformRequest );


        // ---
        // PRVIATE METHODS.
        // ---


        // I serialize the given Object into a key-value pair string. This
        // method expects an object and will default to the toString() method.
        // --
        // NOTE: This is an atered version of the jQuery.param() method which
        // will serialize a data collection for Form posting.
        // --
        // https://github.com/jquery/jquery/blob/master/src/serialize.js#L45
        function serializeData( data ) {

            // If this is not an object, defer to native stringification.
            if ( ! angular.isObject( data ) ) {

                return( ( data === null ) ? "" : data.toString() );

            }

            var buffer = [];

            // Serialize each key in the object.
            for ( var name in data ) {

                if ( ! data.hasOwnProperty( name ) ) {

                    continue;

                }

                var value = data[ name ];

                buffer.push(
                    encodeURIComponent( name ) +
                    "=" +
                    encodeURIComponent( ( value === null ) ? "" : value )
                );

            }

            // Serialize the buffer and clean it up for transportation.
            var source = buffer
                .join( "&" )
                .replace( /%20/g, "+" )
            ;

            return( source );

        }

    }
);
