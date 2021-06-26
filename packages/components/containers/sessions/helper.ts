import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { c } from 'ttag';

const calendarAppName = getAppName(APPS.PROTONCALENDAR);
const driveAppName = getAppName(APPS.PROTONDRIVE);

export const getClientsI18N = () => ({
    Web: c('Badge').t`ProtonMail for web`,
    VPN: c('Badge').t`ProtonVPN for Windows`,
    WebVPN: c('Badge').t`ProtonVPN for web`,
    Admin: c('Badge').t`Admin`,
    ImportExport: c('Badge').t`ProtonMail Import-Export`,
    Bridge: c('Badge').t`ProtonMail Bridge`,
    Android: c('Badge').t`ProtonMail for Android`,
    WebAccount: c('Badge').t`Proton Account for web`,
    WebMail: c('Badge').t`ProtonMail for web`,
    WebMailSettings: c('Badge').t`ProtonMail settings for web`,
    WebContacts: c('Badge').t`ProtonContacts for web`,
    WebVPNSettings: c('Badge').t`ProtonVPN settings for web`,
    WebCalendar: c('Badge').t`${calendarAppName} for web`,
    WebDrive: c('Badge').t`${driveAppName} for web`,
    // WebWallet: c('Badge').t`ProtonWallet for web`,
    WebAdmin: c('Badge').t`Admin`,
    iOS: c('Badge').t`ProtonMail for iOS`,
    iOSDrive: c('Badge').t`${driveAppName} for iOS`,
    iOSMail: c('Badge').t`ProtonMail for iOS`,
    iOSVPN: c('Badge').t`ProtonVPN for iOS`,
    iOSCalendar: c('Badge').t`${calendarAppName} for iOS`,
    AndroidMail: c('Badge').t`ProtonMail for Android`,
    AndroidVPN: c('Badge').t`ProtonVPN for Android`,
    AndroidTvVPN: c('Badge').t`ProtonVPN for Android TV`,
    AndroidCalendar: c('Badge').t`${calendarAppName} for Android`,
    AndroidDrive: c('Badge').t`${driveAppName} for Android`,
    WindowsVPN: c('Badge').t`ProtonVPN for Windows`,
    WindowsImportExport: c('Badge').t`ProtonMail Import-Export for Windows`,
    WindowsBridge: c('Badge').t`ProtonMail Bridge for Windows`,
    macOSVPN: c('Badge').t`ProtonVPN for macOS`,
    macOSImportExport: c('Badge').t`ProtonMail Import-Export for macOS`,
    macOSBridge: c('Badge').t`ProtonMail Bridge for macOS`,
    macOSDrive: c('Badge').t`${driveAppName} for macOS`,
    LinuxImportExport: c('Badge').t`ProtonMail Import-Export for GNU/Linux`,
    LinuxBridge: c('Badge').t`ProtonMail Bridge for GNU/Linux`,
    LinuxVPN: c('Badge').t`ProtonVPN for GNU/Linux`,
});
