import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { useCanDragItems } from '@proton/pass/hooks/useItemDrag';

import { useBulkSelect } from './BulkSelectProvider';

export const BulkView: FC = () => {
    const { count, clear } = useBulkSelect();
    const draggable = useCanDragItems();

    const semiboldText = (
        <span className="text-semibold" key="bulk-count">
            {
                // Translator: the full context is: "You selected <number> item(s) in this vault", where <number> item(s) is with semibold styling
                c('Message').ngettext(msgid`${count} item`, `${count} items`, count)
            }
        </span>
    );

    return (
        <div className="flex justify-center items-center w-full m-auto overflow-x-auto p-3 h-full bg-strong">
            <div className="flex flex-column items-center gap-3 text-center p-2 w-full">
                {count === 0 ? (
                    <p>{
                        // Translator: this message is when there are 0 items selected, as part of the bulk select actions
                        c('Title').t`No items selected`
                    }</p>
                ) : (
                    <>
                        <div className="mb-4">
                            <div>
                                {
                                    // Translator: full sentence is: You selected <number> item/s in this vault; where semiboldText=<number> item/s
                                    c('Message').jt`You selected ${semiboldText} in this vault.`
                                }
                            </div>
                            {draggable && (
                                <div className="color-weak">
                                    {c('Message').ngettext(
                                        msgid`You can drag and drop the selected item to another vault`,
                                        `You can drag and drop the selected items to another vault`,
                                        count
                                    )}
                                </div>
                            )}
                        </div>
                        <Button shape="solid" size="small" color="weak" onClick={clear}>{
                            // Translator: this is button action for deselecting all of the items in bulk select action
                            c('Action').t`Deselect`
                        }</Button>
                    </>
                )}
            </div>
        </div>
    );
};
