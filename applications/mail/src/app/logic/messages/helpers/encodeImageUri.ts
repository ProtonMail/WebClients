const encodeImageUri = (url: string) => {
    return encodeURI(decodeURI(url));
};

export default encodeImageUri;
