import { type ProtonConfig, getProtonConfig } from '@proton/shared/lib/interfaces'

const getFromDom = (): Partial<ProtonConfig> => {
  const scriptTag = document.getElementById('configData')
  if (scriptTag) {
    return JSON.parse(scriptTag.textContent || '{}')
  }
  return {}
}

let defaults = getFromDom()

if (!Object.keys(defaults).length) {
  // Default values are for unit test usage only
  defaults = {
    APP_NAME: 'proton-docs',
    APP_VERSION: '5.0.0+abcdefg',
    CLIENT_SECRET: '',
    CLIENT_TYPE: 1,
    COMMIT: 'ca5ba1f4062ebb502edeffd4e7dd1095560e6622',
  }
}

export default getProtonConfig(defaults)
