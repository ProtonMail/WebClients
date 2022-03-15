const encodeImageUri = (url: string) => {
    // Only replace spaces for the moment
    return url.trim().replaceAll(' ', '%20');
};

export default encodeImageUri;
