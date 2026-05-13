import type { DocumentRole } from '@proton/docs-shared'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { getAppVersion } from '@proton/components'
import { getClientName, getReportInfo } from '@proton/components/helpers/report'
import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'
import { APPS } from '@proton/shared/lib/constants'

type DocsReportContext = {
  documentType?: DocumentType
  role?: DocumentRole
  appVersion: string
  clientType: number
}

const formatReportInfo = (reportInfo: Record<string, string | number | boolean | undefined>) =>
  Object.entries(reportInfo)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([label, value]) => `${label}: ${value}`)

const getDocumentRelation = (role: DocumentRole | undefined) => {
  if (!role) {
    return
  }
  if (role.isPublicViewerOrEditor()) {
    return 'public link'
  }
  if (role.isAdminOrOwner()) {
    return 'owner'
  }
  return 'shared with user'
}

export const getDocsReportContextLines = (context: DocsReportContext) => {
  const roleType = context.role?.roleType
  const reportInfo = getReportInfo()

  return [
    'Automatically collected information:',
    ...formatReportInfo({
      Client: getClientName(APPS.PROTONDOCS),
      'Client version': getAppVersion(context.appVersion),
      'Client type': context.clientType,
      Environment: versionCookieAtLoad ?? 'production',
      'Operating system': [reportInfo.OS, reportInfo.OSVersion].filter(Boolean).join(' '),
      'OS adjusted from touch device': reportInfo.OSArtificial || undefined,
      Browser: [reportInfo.Browser, reportInfo.BrowserVersion].filter(Boolean).join(' '),
      Resolution: reportInfo.Resolution,
      Device: [reportInfo.DeviceName, reportInfo.DeviceModel].filter(Boolean).join(' '),
    }),
    ...formatReportInfo({
      'Document type': context.documentType,
      'Document relation': getDocumentRelation(context.role),
      Role: roleType,
      'Can edit': context.role?.canEdit(),
      'Can comment': context.role?.canComment(),
      'Can share': context.role?.canShare(),
      'Can rename': context.role?.canRename(),
    }),
  ]
}
