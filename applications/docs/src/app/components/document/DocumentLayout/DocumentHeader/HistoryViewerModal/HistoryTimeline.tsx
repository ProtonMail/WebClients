import clsx from '@proton/utils/clsx'
import type { NativeVersionHistory } from '@proton/docs-core'
import { c } from 'ttag'

export type HistoryTimelineProps = {
  versionHistory: NativeVersionHistory
  formattedBatchGroups: ReturnType<NativeVersionHistory['getFormattedBatchGroups']>
  selectedBatchIndex: number
  onSelectedBatchIndexChange: (batchIndex: number) => void
}

export function HistoryTimeline({
  versionHistory,
  formattedBatchGroups,
  selectedBatchIndex,
  onSelectedBatchIndexChange,
}: HistoryTimelineProps) {
  return (
    <>
      {formattedBatchGroups.map(({ formattedDate, batchIndexes }, index) => {
        return (
          <div className="pl-7" key={formattedDate}>
            <div className="flex items-stretch border-l border-[--border-norm]">
              <div className="inline-flex flex-col">
                <span
                  className={clsx(
                    'relative left-[-0.25rem] top-0 pl-2 pt-6',
                    index === 0 && 'bg-[--optional-background-lowered]',
                  )}
                />

                <span className="relative left-[-0.25rem] top-0 inline-block rounded-full border border-[--border-norm] bg-[--optional-background-lowered] pl-1.5 pt-1.5" />
              </div>
              <span className="px-3 pb-2 pt-4 font-bold capitalize">{formattedDate}</span>
            </div>
            <div className="border-l border-[--border-norm] px-4">
              {batchIndexes.map(({ formattedTime, batchIndex }) => {
                return (
                  <div key={batchIndex} className="pt-2">
                    <button
                      className={clsx(
                        'flex w-full items-center justify-between rounded-lg px-2 py-2.5',
                        batchIndex === selectedBatchIndex && 'bg-[--signal-success] text-[--signal-success-contrast]',
                        batchIndex !== selectedBatchIndex &&
                          'text-[--text-weak] hover:bg-[--interaction-default-hover]',
                      )}
                      data-batch-index={batchIndex}
                      onClick={() => {
                        onSelectedBatchIndexChange(batchIndex)
                      }}
                    >
                      <span className="text-sm uppercase">{formattedTime}</span>
                      {versionHistory.isCurrentBatchIndex(batchIndex) && (
                        <span className="text-sm font-semibold">{c('Info').t`Current version`}</span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
