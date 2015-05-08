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

        function get_os() {
            var OSName = "other"; // Unknown OS

            if (navigator.appVersion.indexOf("Win")!=-1) OSName = "windows";
            if (navigator.appVersion.indexOf("Mac")!=-1) OSName = "osx";
            if (navigator.appVersion.indexOf("X11")!=-1) OSName = "linux";
            if (navigator.appVersion.indexOf("Linux")!=-1) OSName = "linux";

            return OSName;
        }

        function get_device() {
            var deviceName = "other";

            // if (navigator.userAgent.match(/Android/i)) deviceName = "android";
            // if (navigator.userAgent.match(/BlackBerry/i)) deviceName = "blackberry";
            // if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) deviceName = "ios";
            // if (navigator.userAgent.match(/Opera Mini/i)) deviceName = "opera";
            // if (navigator.userAgent.match(/IEMobile/i)) deviceName = "windowsPhone"

            return deviceName;
        }

        function find_bootstrap_environment() {
            var envs = ['xs', 'sm', 'md', 'lg'];

            $el = $('<div>');
            $el.appendTo($('body'));

            for (var i = envs.length - 1; i >= 0; i--) {
                var env = envs[i];

                $el.addClass('hidden-'+env);
                if ($el.is(':hidden')) {
                    $el.remove();
                    return env
                }
            };
        }

        var tools = {
            findBootstrapEnvironment: find_bootstrap_environment,
            getOs: get_os(),
            getDevice: get_device(),
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
