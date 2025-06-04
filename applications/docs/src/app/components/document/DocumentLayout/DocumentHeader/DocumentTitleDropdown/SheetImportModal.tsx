import { Button } from '@proton/atoms'
import type { ModalStateProps } from '@proton/components'
import { Checkbox, Icon, ModalTwo, ModalTwoContent, SelectTwo, Option, useModalTwoStatic } from '@proton/components'
import { SheetImportDestination, SheetImportSeparatorType, type SheetImportData } from '@proton/docs-shared'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import clsx from '@proton/utils/clsx'
import { useRef, useState } from 'react'
import { c } from 'ttag'

export interface SheetImportModalProps extends ModalStateProps {
  handleImport: (data: SheetImportData) => void
}

const MIMETYPES_TO_ACCEPT = [SupportedProtonDocsMimeTypes.csv, SupportedProtonDocsMimeTypes.tsv].join(', ')

function SheetImportModal({ handleImport, onClose, open, ...modalProps }: SheetImportModalProps) {
  const [isOpen, setIsOpen] = useState(open)

  const [file, setFile] = useState<File>()
  const [shouldConvertCells, setShouldConvertCells] = useState(true)
  const [destination, setDestination] = useState<SheetImportDestination>(SheetImportDestination.InsertAsNewSheet)
  const inputRef = useRef<HTMLInputElement>(null)

  const closeModal = () => {
    setIsOpen(false)
    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  return (
    <ModalTwo
      data-testid="sheet-import-modal"
      fullscreen={false}
      size="medium"
      open={isOpen === undefined ? true : isOpen}
      onClose={closeModal}
      {...modalProps}
    >
      <ModalTwoContent className="mx-0 py-4">
        <div className="px-8">
          <h1 className="mb-1.5 text-2xl font-bold">{c('sheets_2025:Title').t`Import data`}</h1>
          <div className="mb-2 text-[--text-hint]">{c('sheets_2025:Info').t`Select a CSV or TSV file to import`}</div>
          <div className={clsx('flex items-center', file ? 'mb-2' : 'mb-4')}>
            <span className="mr-2 text-[--text-hint]">{c('Label').t`File`}</span>
            {file ? (
              <>
                <span className="mr-1 max-w-[20ch] overflow-hidden text-ellipsis" title={file.name}>
                  {file.name}
                </span>
                <Button icon shape="ghost" onClick={() => setFile(undefined)}>
                  <Icon className="text-[--signal-danger]" name="trash" />
                  <span className="sr-only">{c('Action').t`Remove file`}</span>
                </Button>
              </>
            ) : (
              <>
                <label className="sr-only">
                  {c('Label').t`File`}
                  <input
                    ref={inputRef}
                    type="file"
                    accept={MIMETYPES_TO_ACCEPT}
                    onChange={(event) => {
                      if (!event.target.files || event.target.files.length !== 1) {
                        return
                      }
                      setFile(event.target.files[0])
                      setShouldConvertCells(true)
                    }}
                  />
                </label>
                <Button size="small" onClick={() => inputRef.current?.click()}>
                  Browse
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="border-weak border-y px-8 pb-5 pt-4">
          <div className="grid grid-cols-2 grid-rows-[auto,1fr] gap-x-4 gap-y-2">
            <div className="text-[--text-hint] [grid-column:1]">{c('sheets_2025:Label').t`Destination`}</div>
            <SelectTwo value={destination} onValue={setDestination} className="[grid-column:1]">
              <Option
                title={c('sheets_2025:Info').t`Insert as new sheet`}
                value={SheetImportDestination.InsertAsNewSheet}
              />
              <Option
                title={c('sheets_2025:Info').t`Replace data at selected cell`}
                value={SheetImportDestination.ReplaceAtSelectedCell}
              />
              <Option
                title={c('sheets_2025:Info').t`Replace current sheet`}
                value={SheetImportDestination.ReplaceCurrentSheet}
              />
            </SelectTwo>
            <div className="text-[--text-hint] [grid-column:2] [grid-row:1]">{c('sheets_2025:Label')
              .t`Separator type`}</div>
            <div className="self-center [grid-column:2]">{c('sheets_2025:Info').t`Detect automatically`}</div>
          </div>
          <div className="h-4" />
          <div className="flex flex-col gap-2">
            <div className="text-[--text-hint]">{c('sheets_2025:Label').t`Format`}</div>
            <Checkbox
              checked={shouldConvertCells}
              onChange={(event) => {
                const checked = event.target.checked
                setShouldConvertCells(checked)
              }}
            >{c('sheets_2025:Label').t`Convert text to numbers, dates, and formulas`}</Checkbox>
          </div>
        </div>
        <div className="flex gap-4 px-8 pt-4">
          <Button className="ml-auto" onClick={closeModal}>{c('Action').t`Cancel`}</Button>
          <Button
            disabled={!file}
            shape="solid"
            color="norm"
            onClick={() => {
              if (!file) {
                return
              }
              handleImport({
                file,
                shouldConvertCellContents: shouldConvertCells,
                destination,
                separatorType: SheetImportSeparatorType.DetectAutomatically,
              })
              closeModal()
            }}
          >{c('Action').t`Import data`}</Button>
        </div>
      </ModalTwoContent>
    </ModalTwo>
  )
}

export function useSheetImportModal() {
  return useModalTwoStatic(SheetImportModal)
}
