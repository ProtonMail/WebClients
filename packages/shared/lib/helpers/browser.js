export const hasModulesSupport = () => {
    const script = document.createElement('script');
    return 'noModule' in script;
};

export const isFileSaverSupported = () => 'download' in document.createElement('a') || navigator.msSaveOrOpenBlob;

export const textToClipboard = (text) => {
    const dummy = document.createElement('textarea');

    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
};
