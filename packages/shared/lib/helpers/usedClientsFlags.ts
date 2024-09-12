import { USED_CLIENT_FLAGS } from '../interfaces';
import { hasBitBigInt } from './bitset';

const {
    WEB_VPN_SETTINGS,
    WEB_DRIVE,
    WEB_VPN,
    BROWSER_VPN,
    WINDOWS_INBOX,
    WINDOWS_DRIVE,
    WINDOWS_VPN,
    LINUX_VPN,
    LINUX_PASS,
    ANDROID_PASS,
    IOS_PASS,
    WEB_PASS,
    MACOS_PASS,
    WINDOWS_PASS,
    MACOS_DRIVE,
    MACOS_VPN,
    MACOS_INBOX,
    IOS_DRIVE,
    IOS_VPN,
    LINUX_INBOX,
    ANDROID_DRIVE,
    ANDROID_VPN,
    ANDROID_TV_VPN,
    APPLE_TV_VPN,
    ANDROID_CALENDAR,
    IOS_CALENDAR,
    ANDROID_MAIL,
    IOS_MAIL,
} = USED_CLIENT_FLAGS;

const isAndroidCalendarUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, ANDROID_CALENDAR);
const isIOSCalendarUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, IOS_CALENDAR);

const isWebDriveUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, WEB_DRIVE);
const isAndroidDriveUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, ANDROID_DRIVE);
const isIOSDriveUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, IOS_DRIVE);
const isDesktopDriveUser = (usedClientFlags: bigint) =>
    hasBitBigInt(usedClientFlags, WINDOWS_DRIVE) || hasBitBigInt(usedClientFlags, MACOS_DRIVE);

const isAndroidMailUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, ANDROID_MAIL);
const isIOSMailUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, IOS_MAIL);

const isWebPassUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, WEB_PASS);
const isAndroidPassUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, ANDROID_PASS);
const isIOSPassUser = (usedClientFlags: bigint) => hasBitBigInt(usedClientFlags, IOS_PASS);
const isDesktopPassUser = (usedClientFlags: bigint) =>
    hasBitBigInt(usedClientFlags, WINDOWS_PASS) ||
    hasBitBigInt(usedClientFlags, LINUX_PASS) ||
    hasBitBigInt(usedClientFlags, MACOS_PASS);

const isWebVPNUser = (usedClientFlags: bigint) =>
    hasBitBigInt(usedClientFlags, WEB_VPN) ||
    hasBitBigInt(usedClientFlags, WEB_VPN_SETTINGS) ||
    hasBitBigInt(usedClientFlags, BROWSER_VPN);
const isAndroidVPNUser = (usedClientFlags: bigint) =>
    hasBitBigInt(usedClientFlags, ANDROID_VPN) || hasBitBigInt(usedClientFlags, ANDROID_TV_VPN);
const isIOSVPNUser = (usedClientFlags: bigint) =>
    hasBitBigInt(usedClientFlags, IOS_VPN) || hasBitBigInt(usedClientFlags, APPLE_TV_VPN);
const isDesktopVPNUser = (usedClientFlags: bigint) =>
    hasBitBigInt(usedClientFlags, WINDOWS_VPN) ||
    hasBitBigInt(usedClientFlags, LINUX_VPN) ||
    hasBitBigInt(usedClientFlags, MACOS_VPN);

export const isCalendarMobileAppUser = (usedClientFlags: bigint) => {
  return (
      isAndroidCalendarUser(usedClientFlags) || isIOSCalendarUser(usedClientFlags)
  );
};

export const isDesktopInboxUser = (usedClientFlags: bigint) => {
    return (
        hasBitBigInt(usedClientFlags, WINDOWS_INBOX) ||
        hasBitBigInt(usedClientFlags, LINUX_INBOX) ||
        hasBitBigInt(usedClientFlags, MACOS_INBOX)
    );
};

export const isDriveUser = (usedClientFlags: bigint) => {
    return (
        isWebDriveUser(usedClientFlags) ||
        isAndroidDriveUser(usedClientFlags) ||
        isIOSDriveUser(usedClientFlags) ||
        isDesktopDriveUser(usedClientFlags)
    );
};

export const isDriveMobileAppUser = (usedClientFlags: bigint) => {
  return (
      isAndroidDriveUser(usedClientFlags) || isIOSDriveUser(usedClientFlags)
  );
};

export const isMailMobileAppUser = (usedClientFlags: bigint) => {
  return (
      isAndroidMailUser(usedClientFlags) || isIOSMailUser(usedClientFlags)
  );
};

export const isPassUser = (usedClientFlags: bigint) => {
    return (
        isWebPassUser(usedClientFlags) ||
        isAndroidPassUser(usedClientFlags) ||
        isIOSPassUser(usedClientFlags) ||
        isDesktopPassUser(usedClientFlags)
    );
};

export const isVPNUser = (usedClientFlags: bigint) => {
    return (
        isWebVPNUser(usedClientFlags) ||
        isAndroidVPNUser(usedClientFlags) ||
        isIOSVPNUser(usedClientFlags) ||
        isDesktopVPNUser(usedClientFlags)
    );
};
