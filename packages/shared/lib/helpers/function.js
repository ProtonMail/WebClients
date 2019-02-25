export const noop = () => {};

export const debounce = (func, ms, immediate) => {
	let timeout;

	return function (...args) {
		clearTimeout(timeout);

		timeout = setTimeout(() => {
			timeout = null;
			if (!immediate) {
				func.apply(this, args);
			}
		}, ms);

		if (immediate && !timeout) {
			func.apply(this, [...args]);
		}
	}
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