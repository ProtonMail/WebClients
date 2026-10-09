import UAParser from 'ua-parser-js'

/** Match the OS classification used for keyboard shortcuts throughout Docs. */
export const isMacUserAgent = (userAgent: string): boolean => new UAParser(userAgent).getOS().name === 'Mac OS'

const mac = new UAParser().getOS().name === 'Mac OS'

export const isMac = (): boolean => mac
