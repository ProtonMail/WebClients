export const getAppVersion = (versionString: string) => {
    return versionString.replace(/-beta.(\d+)/, ' - Beta $1');
};
