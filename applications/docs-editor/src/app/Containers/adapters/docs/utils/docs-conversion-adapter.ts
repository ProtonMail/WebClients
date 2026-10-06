import type { EditorInitializationConfig as HostEditorInitializationConfig } from '@proton/docs-shared/lib/EditorInitializationConfig'
import type { DataTypesThatDocumentCanBeExportedAs as HostExportFormat } from '@proton/docs-shared/lib/ExportableDataType'

import type {
  ConvertibleDataType,
  DataTypesThatDocumentCanBeExportedAs,
  EditorInitializationConfig,
} from '../../../Docs/public'

const supportedDocsImportDataTypes = {
  txt: true,
  md: true,
  html: true,
  json: true,
  docx: true,
  odt: true,
} satisfies Record<ConvertibleDataType['dataType'], true>

function isDocsImportDataType(dataType: string): dataType is ConvertibleDataType['dataType'] {
  return Object.hasOwn(supportedDocsImportDataTypes, dataType)
}

export function toDocsInitialization(
  config: HostEditorInitializationConfig | undefined,
): EditorInitializationConfig | undefined {
  if (!config || config.mode === 'creation') {
    return config
  }

  if (config.type.docType !== 'doc' || !isDocsImportDataType(config.type.dataType)) {
    throw new Error(`Unsupported Docs conversion: ${config.type.docType}/${config.type.dataType}`)
  }

  return {
    mode: 'conversion',
    data: config.data,
    type: { docType: 'doc', dataType: config.type.dataType },
  }
}

export function toDocsExportFormat(format: HostExportFormat): DataTypesThatDocumentCanBeExportedAs {
  switch (format) {
    case 'docx':
    case 'odt':
    case 'html':
    case 'txt':
    case 'md':
    case 'yjs':
      return format
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}
