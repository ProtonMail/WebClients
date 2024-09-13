import { DefaultProtocol } from "./types";

export const checkDefaultMailtoClientLinux = (): DefaultProtocol => ({
    // FIXME:jcuth
    // Need to check desktop file exists:
    // /usr/share/applications/proton-mail.desktop
    //
    // Need to check is default:
    // spawn xdg-mime query default x-scheme-handler/mailto
    // answer should be `proton-mail.desktop`
    isDefault: false,
    isChecked: false,
});

export const setDefaultMailtoLinux = () => {
    // FIXME:jcuth
    // check there is .desktop file
    // use xdg to set default
};
