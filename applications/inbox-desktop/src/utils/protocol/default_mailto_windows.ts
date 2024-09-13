import { DefaultProtocol } from "./types";

export const checkDefaultMailtoClientWindows = (): DefaultProtocol => ({
    // FIXME:jcuth
    // Need to check we have class registered
    // spawn reg query HKCU\Software\Classes\ProtonMail.Url.mailto\shell\open\command
    //   should contain `Proton Mail.exe`
    //
    // Need to check we are default mailto associated
    // spawn reg quuery HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\mailto\UserChoice \v ProgId
    //    should be `ProtonMail.Url.mailto`
    //
    // [HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\mailto\UserChoice]
    // "Progid"="ProtonMail.Url.mailto"
    isDefault: false,
    isChecked: false,
});

export const setDefaultMailtoWindows = () => {
    // FIXME:jcuth
    // check there is class in reg
    // set user choice
};
