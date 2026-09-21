import * as Icons from '../../icons'
import * as Ariakit from '@ariakit/react'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import { CircleLoader } from '../../CircleLoader/CircleLoader'
import { useSheetsDependencies, type SheetsExportFormat } from '../../../SheetsDependenciesProvider'
import { useUI } from '../../../ui-store'
import { VersionNumber } from '../../VersionNumber/VersionNumber'

const { s } = createStringifier(strings)

type WithLoading = <T>(promise: undefined | Promise<T | void> | (() => Promise<T | void>)) => Promise<T | void>
type MenuAction = () => Promise<void>

function unwrapPromise<T>(maybeWrappedPromise: Promise<T | void> | (() => Promise<T | void>)): Promise<T | void> {
  if (typeof maybeWrappedPromise === 'function') {
    return maybeWrappedPromise()
  }

  return maybeWrappedPromise
}

function useMenuActionLoading(): [boolean, WithLoading] {
  const [loading, setLoading] = useState(false)
  const unmountedRef = useRef(false)
  const counterRef = useRef(0)

  const withLoading = useCallback<WithLoading>((maybeWrappedPromise) => {
    if (!maybeWrappedPromise) {
      setLoading(false)
      return Promise.resolve()
    }

    const promise = unwrapPromise(maybeWrappedPromise)
    const counterNext = counterRef.current + 1
    counterRef.current = counterNext

    setLoading(true)

    return promise
      .then((result) => {
        if (counterRef.current !== counterNext) {
          return
        }

        if (!unmountedRef.current) {
          setLoading(false)
        }

        return result
      })
      .catch((error) => {
        if (counterRef.current !== counterNext) {
          return
        }

        if (!unmountedRef.current) {
          setLoading(false)
        }

        throw error
      })
  }, [])

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
    }
  }, [])

  return [loading, withLoading]
}

export interface FileMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
  isPublicMode: boolean
}

export function FileMenu({ renderMenuButton, isPublicMode, ...props }: FileMenuProps) {
  const { canEdit, canTrash, versionInfo, fileMenuActions, reportError } = useSheetsDependencies()

  const [showVersionNumber, setShowVersionNumber] = useState(false)
  const [showDebugToggle, setShowDebugToggle] = useState(false)
  useEffect(() => {
    // When the user holds down the shift key, show the version number. When they release, hide it.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey) {
        setShowVersionNumber(true)
        if (event.ctrlKey) {
          setShowDebugToggle((prev) => !prev)
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.shiftKey) {
        setShowVersionNumber(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const store = Ariakit.useMenuStore()
  const mounted = Ariakit.useStoreState(store, 'mounted')
  useEffect(() => {
    if (!mounted) {
      setShowDebugToggle(false)
    }
  }, [mounted])

  const triggerMenuAction = useCallback((action: MenuAction) => action().catch(reportError), [reportError])

  return (
    <Ariakit.MenuProvider {...props} store={store}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu unmountOnHide>
        {!isPublicMode ? (
          <LoadingMenuOption
            action={fileMenuActions.createSpreadsheet}
            triggerMenuAction={triggerMenuAction}
            icon={Icons.brandProtonSheets}
            label={s('New spreadsheet')}
          />
        ) : null}
        {!isPublicMode ? (
          <LoadingMenuOption
            action={fileMenuActions.createDocument}
            triggerMenuAction={triggerMenuAction}
            icon={Icons.brandProtonDocs}
            label={s('New document')}
          />
        ) : null}
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.fileArrowInUp} />}
          onClick={() => {
            void triggerMenuAction(fileMenuActions.import)
          }}
          disabled={!canEdit}
        >
          {s('Import')}
        </UI.MenuItem>
        {!isPublicMode ? (
          <LoadingMenuOption
            action={fileMenuActions.makeCopy}
            triggerMenuAction={triggerMenuAction}
            icon={Icons.squares}
            label={s('Make a copy')}
          />
        ) : null}
        {!isPublicMode ? (
          <>
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.arrowsCross} />}
              onClick={() => {
                void triggerMenuAction(fileMenuActions.moveToFolder)
              }}
            >
              {s('Move to folder')}
            </UI.MenuItem>
            <UI.MenuSeparator />
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.clockRotateLeft} />}
              onClick={() => {
                void triggerMenuAction(fileMenuActions.viewVersionHistory)
              }}
            >
              {s('See version history')}
            </UI.MenuItem>
            {canTrash ? (
              <LoadingMenuOption
                action={fileMenuActions.moveToTrash}
                triggerMenuAction={triggerMenuAction}
                icon={Icons.trash}
                label={s('Move to trash')}
              />
            ) : null}
          </>
        ) : null}
        <UI.MenuSeparator />
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.printer} />}
          onClick={() => {
            void triggerMenuAction(fileMenuActions.print)
          }}
        >
          {s('Print')}
        </UI.MenuItem>
        <DownloadSubmenu download={fileMenuActions.download} triggerMenuAction={triggerMenuAction} />
        <UI.MenuSeparator />
        <SpreadsheetSettings />
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.infoCircle} />}
          onClick={() => {
            void triggerMenuAction(fileMenuActions.openHelp)
          }}
          hintSlot={
            showVersionNumber && (
              <VersionNumber
                className="ml-auto text-[--text-hint]"
                version={versionInfo.version}
                environment={versionInfo.environment}
              />
            )
          }
        >
          <span>{s('Help')}</span>
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.brandProtonSheets} />}
          onClick={() => {
            void triggerMenuAction(fileMenuActions.viewRecentSpreadsheets)
          }}
        >
          {s('View recent spreadsheets')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.brandProtonDrive} />}
          onClick={() => {
            void triggerMenuAction(fileMenuActions.openProtonDrive)
          }}
        >
          {s('Open Proton Drive')}
        </UI.MenuItem>
        {/* TODO: add download logs option */}
        {showDebugToggle ? (
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.cogWheel} />}
            onClick={() => {
              void triggerMenuAction(fileMenuActions.toggleDebugMode)
            }}
          >
            {s('Toggle debug mode')}
          </UI.MenuItem>
        ) : null}
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function LoadingMenuOption({
  action,
  triggerMenuAction,
  icon,
  label,
}: {
  action: MenuAction
  triggerMenuAction: (action: MenuAction) => Promise<void>
  icon: ComponentProps<typeof UI.Icon>['data']
  label: string
}) {
  const [loading, withLoading] = useMenuActionLoading()
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={icon} />}
      disabled={loading}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void withLoading(triggerMenuAction(action))
      }}
      trailingIconSlot={loading && <CircleLoader size="small" className="ml-auto" />}
    >
      {label}
    </UI.MenuItem>
  )
}

function DownloadSubmenu({
  download,
  triggerMenuAction,
}: {
  download: (format: SheetsExportFormat) => Promise<void>
  triggerMenuAction: (action: MenuAction) => Promise<void>
}) {
  const { featureFlags } = useSheetsDependencies()
  const triggerDownload = (format: SheetsExportFormat) => triggerMenuAction(() => download(format))

  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.arrowDownToSquare} />}>
        {s('Download')}
      </UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        <UI.MenuItem
          onClick={() => {
            void triggerDownload('xlsx')
          }}
        >
          {s('Microsoft Excel (.xlsx)')}
        </UI.MenuItem>
        {featureFlags.SheetsODSExportEnabled && (
          <UI.MenuItem
            onClick={() => {
              void triggerDownload('ods')
            }}
          >
            {s('OpenDocument Spreadsheet (.ods) (Beta)')}
          </UI.MenuItem>
        )}
        <UI.MenuItem
          onClick={() => {
            void triggerDownload('csv')
          }}
        >
          {s('Comma Separated Values (.csv)')}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={() => {
            void triggerDownload('tsv')
          }}
        >
          {s('Tab Separated Values (.tsv)')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function SpreadsheetSettings() {
  const isReadonly = useUI((state) => state.info.isReadonly)
  const store = useUI((ui) => ui.view.spreadsheetSettingsDialog.store)

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.cogWheel} />}
      disabled={isReadonly}
      onClick={() => store.show()}
    >
      {s('Settings')}
    </UI.MenuItem>
  )
}

function strings() {
  return {
    'New spreadsheet': c('sheets_2025:Spreadsheet editor menubar file menu').t`New spreadsheet`,
    'New document': c('sheets_2025:Spreadsheet editor menubar file menu').t`New document`,
    Import: c('sheets_2025:Spreadsheet editor menubar file menu').t`Import`,
    'Make a copy': c('sheets_2025:Spreadsheet editor menubar file menu').t`Make a copy`,
    'Move to folder': c('sheets_2025:Spreadsheet editor menubar file menu').t`Move to folder`,
    'See version history': c('sheets_2025:Spreadsheet editor menubar file menu').t`See version history`,
    'Move to trash': c('sheets_2025:Spreadsheet editor menubar file menu').t`Move to trash`,
    Print: c('sheets_2025:Spreadsheet editor menubar file menu').t`Print`,
    Download: c('sheets_2025:Spreadsheet editor menubar file menu').t`Download`,
    'Microsoft Excel (.xlsx)': c('sheets_2025:Spreadsheet editor menubar file menu').t`Microsoft Excel (.xlsx)`,
    'OpenDocument Spreadsheet (.ods) (Beta)': c('sheets_2025:Spreadsheet editor menubar file menu')
      .t`OpenDocument Spreadsheet (.ods) (Beta)`,
    'Comma Separated Values (.csv)': c('sheets_2025:Spreadsheet editor menubar file menu')
      .t`Comma Separated Values (.csv)`,
    'Tab Separated Values (.tsv)': c('sheets_2025:Spreadsheet editor menubar file menu').t`Tab Separated Values (.tsv)`,
    Help: c('sheets_2025:Spreadsheet editor menubar file menu').t`Help`,
    'View recent spreadsheets': c('sheets_2025:Spreadsheet editor menubar file menu').t`View recent spreadsheets`,
    'Open Proton Drive': c('sheets_2025:Spreadsheet editor menubar file menu').t`Open ${DRIVE_APP_NAME}`,
    'Download logs': c('sheets_2025:Spreadsheet editor menubar file menu').t`Download logs`,
    'Toggle debug mode': c('sheets_2025:Spreadsheet editor menubar file menu').t`Toggle debug mode`,
    Settings: c('sheets_2025:Spreadsheet editor menubar file menu').t`Settings`,
  }
}
