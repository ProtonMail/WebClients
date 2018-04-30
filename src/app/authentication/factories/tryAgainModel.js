function tryAgainModel() {
    const CACHE = {};
    const remove = (url) => delete CACHE[url];
    const add = (url) => (CACHE[url] = true);
    const check = (url) => CACHE[url];

    return { add, check, remove };
}

export default tryAgainModel;
