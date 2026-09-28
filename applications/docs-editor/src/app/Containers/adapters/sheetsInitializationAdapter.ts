import type { EditorInitializationConfig } from '@proton/docs-shared/lib/EditorInitializationConfig'

import type { SheetsImportDataType, SheetsInitialization } from '../Spreadsheet/public'

const supportedSheetsImportDataTypes = {
  csv: true,
  ods: true,
  tsv: true,
  xlsx: true,
} satisfies Record<SheetsImportDataType, true>

function isSheetsImportDataType(dataType: string): dataType is SheetsImportDataType {
  return Object.hasOwn(supportedSheetsImportDataTypes, dataType)
}

export function toSheetsInitialization(config: EditorInitializationConfig | undefined): SheetsInitialization {
  if (!config) {
    return { mode: 'existing' }
  }

  if (config.mode === 'creation') {
    return { mode: 'creation' }
  }

  if (!isSheetsImportDataType(config.type.dataType)) {
    return { mode: 'creation' }
  }

  return {
    mode: 'conversion',
    data: config.data,
    dataType: config.type.dataType,
  }
}
