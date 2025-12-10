import * as Ariakit from '@ariakit/react'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import type { EditorRequiresClientMethods, FileMenuAction } from '@proton/docs-shared'
import { reportErrorToSentry } from '../../../../../Utils/errorMessage'
import useLoading from '@proton/hooks/useLoading'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { useApplication } from '../../../../ApplicationProvider'

const { s } = createStringifier(strings)

export interface FileMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
  clientInvoker: EditorRequiresClientMethods
  isPublicMode: boolean
}

export function FileMenu({ renderMenuButton, clientInvoker, isPublicMode, ...props }: FileMenuProps) {
  const { application } = useApplication()

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

  const triggerMenuAction = useCallback(
    async (action: FileMenuAction) => {
      try {
        await clientInvoker.handleFileMenuAction(action)
      } catch (error) {
        console.error(error)
        reportErrorToSentry(error)
      }
    },
    [clientInvoker],
  )

  return (
    <Ariakit.MenuProvider {...props} store={store}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu unmountOnHide>
        {!isPublicMode ? <NewSpreadsheetOption triggerMenuAction={triggerMenuAction} /> : null}
        {!isPublicMode ? <NewDocumentOption triggerMenuAction={triggerMenuAction} /> : null}
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="file-arrow-in-up" />}
          onClick={() => {
            void triggerMenuAction({
              type: 'import',
            })
          }}
          disabled={!application.getRole().canEdit()}
        >
          {s('Import')}
        </UI.MenuItem>
        {!isPublicMode && (
          <>
            <MakeACopyOption triggerMenuAction={triggerMenuAction} />
            <UI.MenuItem
              leadingIconSlot={<UI.Icon legacyName="arrows-cross" />}
              onClick={() => {
                void triggerMenuAction({
                  type: 'move-to-folder',
                })
              }}
            >
              {s('Move to folder')}
            </UI.MenuItem>
            <UI.MenuSeparator />
            <UI.MenuItem
              leadingIconSlot={<UI.Icon legacyName="clock-rotate-left" />}
              onClick={() => {
                void triggerMenuAction({
                  type: 'see-version-history',
                })
              }}
            >
              {s('See version history')}
            </UI.MenuItem>
            {application.getRole().canTrash() && <MoveToTrashOption triggerMenuAction={triggerMenuAction} />}
          </>
        )}
        <UI.MenuSeparator />
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="printer" />}
          onClick={() => {
            void triggerMenuAction({
              type: 'print',
            })
          }}
        >
          {s('Print')}
        </UI.MenuItem>
        <DownloadSubmenu triggerMenuAction={triggerMenuAction} />
        <UI.MenuSeparator />
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="info-circle" />}
          onClick={() => {
            void triggerMenuAction({
              type: 'help',
            })
          }}
          hintSlot={showVersionNumber && <span className="ml-auto text-[--text-hint]">v{application.appVersion}</span>}
        >
          <span>{s('Help')}</span>
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="brand-proton-sheets" />}
          onClick={() => {
            void triggerMenuAction({
              type: 'view-recent-spreadsheets',
            })
          }}
        >
          {s('View recent spreadsheets')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="brand-proton-drive" />}
          onClick={() => {
            void triggerMenuAction({
              type: 'open-proton-drive',
            })
          }}
        >
          {s('Open Proton Drive')}
        </UI.MenuItem>
        {/* TODO: add download logs option */}
        {showDebugToggle && (
          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="cog-wheel" />}
            onClick={() => {
              void triggerMenuAction({
                type: 'toggle-debug-mode',
              })
            }}
          >
            {s('Toggle debug mode')}
          </UI.MenuItem>
        )}
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function NewSpreadsheetOption({ triggerMenuAction }: { triggerMenuAction: (action: FileMenuAction) => Promise<void> }) {
  const [loading, withLoading] = useLoading()
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="brand-proton-sheets" />}
      disabled={loading}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void withLoading(
          triggerMenuAction({
            type: 'new-spreadsheet',
          }),
        )
      }}
      trailingIconSlot={loading && <CircleLoader size="small" className="ml-auto" />}
    >
      {s('New spreadsheet')}
    </UI.MenuItem>
  )
}

function NewDocumentOption({ triggerMenuAction }: { triggerMenuAction: (action: FileMenuAction) => Promise<void> }) {
  const [loading, withLoading] = useLoading()
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="brand-proton-docs" />}
      disabled={loading}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void withLoading(
          triggerMenuAction({
            type: 'new-document',
          }),
        )
      }}
      trailingIconSlot={loading && <CircleLoader size="small" className="ml-auto" />}
    >
      {s('New document')}
    </UI.MenuItem>
  )
}

function MakeACopyOption({ triggerMenuAction }: { triggerMenuAction: (action: FileMenuAction) => Promise<void> }) {
  const [loading, withLoading] = useLoading()
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="squares" />}
      disabled={loading}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void withLoading(
          triggerMenuAction({
            type: 'make-a-copy',
          }),
        )
      }}
      trailingIconSlot={loading && <CircleLoader size="small" className="ml-auto" />}
    >
      {s('Make a copy')}
    </UI.MenuItem>
  )
}

function MoveToTrashOption({ triggerMenuAction }: { triggerMenuAction: (action: FileMenuAction) => Promise<void> }) {
  const [loading, withLoading] = useLoading()
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="trash" />}
      disabled={loading}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void withLoading(
          triggerMenuAction({
            type: 'move-to-trash',
          }),
        )
      }}
      trailingIconSlot={loading && <CircleLoader size="small" className="ml-auto" />}
    >
      {s('Move to trash')}
    </UI.MenuItem>
  )
}

function DownloadSubmenu({ triggerMenuAction }: { triggerMenuAction: (action: FileMenuAction) => Promise<void> }) {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="arrow-down-to-square" />}>
        {s('Download')}
      </UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        <UI.MenuItem
          onClick={() => {
            void triggerMenuAction({
              type: 'download',
              format: 'xlsx',
            })
          }}
        >
          {s('Microsoft Excel (.xlsx)')}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={() => {
            void triggerMenuAction({
              type: 'download',
              format: 'csv',
            })
          }}
        >
          {s('Comma Separated Values (.csv)')}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={() => {
            void triggerMenuAction({
              type: 'download',
              format: 'tsv',
            })
          }}
        >
          {s('Tab Separated Values (.tsv)')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
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
    'Comma Separated Values (.csv)': c('sheets_2025:Spreadsheet editor menubar file menu')
      .t`Comma Separated Values (.csv)`,
    'Tab Separated Values (.tsv)': c('sheets_2025:Spreadsheet editor menubar file menu').t`Tab Separated Values (.tsv)`,
    Help: c('sheets_2025:Spreadsheet editor menubar file menu').t`Help`,
    'View recent spreadsheets': c('sheets_2025:Spreadsheet editor menubar file menu').t`View recent spreadsheets`,
    'Open Proton Drive': c('sheets_2025:Spreadsheet editor menubar file menu').t`Open ${DRIVE_APP_NAME}`,
    'Download logs': c('sheets_2025:Spreadsheet editor menubar file menu').t`Download logs`,
    'Toggle debug mode': c('sheets_2025:Spreadsheet editor menubar file menu').t`Toggle debug mode`,
  }
}
