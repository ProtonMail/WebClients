// Navigate through these instead of `window.location`: jsdom does not let a test mock its methods.
export const assignUrl = (url: string) => window.location.assign(url);
export const reloadWindow = () => window.location.reload();
