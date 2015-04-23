angular.module("proton.tools", [])
    .factory("tools", function($log, errorReporter) {
        function has_session_storage() {
            var mod = 'modernizr';

            try {
                sessionStorage.setItem(mod, mod);
                sessionStorage.removeItem(mod);
                return true;
            } catch (e) {
                return false;
            }
        }

        function get_browser() {
            var N = navigator.appName,
                ua = navigator.userAgent,
                tem;
            var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
            if (M && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) M[2] = tem[1];
            M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
            return M[0];
        }

        function get_browser_version() {
            var N = navigator.appName,
                ua = navigator.userAgent,
                tem;
            var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
            if (M && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) M[2] = tem[1];
            M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
            return M[1];
        }

        function is_good_prng_available() {
            if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
                return true;
            } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
                return true;
            } else {
                return false;
            }
        }

        var tools = {
            getBrowser: get_browser(),
            getBrowserVersion: get_browser_version(),
            isCompatible: function() {
                var compatible = true;

                if (!has_session_storage()) {
                    compatible = false;
                }

                if (!is_good_prng_available()) {
                    compatible = false;
                }

                return compatible;
            },
            validEmail: function(value) {
                var filter = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$";

                return String(value).search(filter) != -1;
            }
        };

        return tools;
    });
