angular.module("proton.sample", [])

.directive('ngSample', function () {
    function randomChars() {
        var chars = '';
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);
        chars += Math.random().toString(36).slice(2);        
        return chars;
    }
    return {
        template: '<div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div><div class="message placeholder">'+randomChars()+'</div>'
    };
});
