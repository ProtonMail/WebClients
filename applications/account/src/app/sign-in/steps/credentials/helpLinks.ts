import type { Paths } from '../../../content/helper';

export const getHelpLinks = (paths: Paths, username: string) => {
    const query = new URLSearchParams(username ? { username } : {}).toString();
    return {
        signinHelpPath: `${paths.signinHelp}?${query}`,
        resetPath: `${paths.reset}?${query}`,
        forgotUsernamePath: `${paths.forgotUsername}?${query}`,
    };
};
