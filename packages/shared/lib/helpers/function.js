export const noop = () => {};

export const debounce = (fn, time) => {
    let timeout;

    return function() {
        const functionCall = () => fn.apply(this, arguments);

        clearTimeout(timeout);
        timeout = setTimeout(functionCall, time);
    };
};

export const throttle = (func, ms = 50, context = window) => {
	let wait = false;

    return (...args) => {
	  const later = () => {
		  func.apply(context, args);
	  };

      if (!wait) {
		  later();
		  wait = true;
		  setTimeout(() => {
		    wait = false;
		  }, ms);
	  }
	};
};