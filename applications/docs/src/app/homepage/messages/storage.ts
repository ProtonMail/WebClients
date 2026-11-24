export const storageMessages = {
  storage: {
    bytes: (count: number): string => (count === 1 ? 'byte' : 'bytes'),
    KB: 'KB',
    MB: 'MB',
    GB: 'GB',
    currentStorage: 'Your current storage:',
    upgradeStorage: 'Upgrade storage',
    copyVersion: (version: string) => `Copy “${version}” to clipboard`,
    versionCopied: 'Version number successfully copied to clipboard',
  },
}
