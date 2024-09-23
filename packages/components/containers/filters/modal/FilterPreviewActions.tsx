import { Fragment } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import LabelStack from '@proton/components/components/labelStack/LabelStack';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import { getDefaultFolders } from '../constants';
import type { SimpleFilterModalModel } from '../interfaces';

interface Props {
    labels: Label[];
    folders: Folder[];
    model: SimpleFilterModalModel;
    toggleOpen: () => void;
    isOpen: boolean;
}

const FilterPreviewActions = ({ isOpen, toggleOpen, labels, folders, model }: Props) => {
    const LABELS_ACTION = {
        labelAs: c('Action').t`label emails as`,
        moveTo: c('Action').t`move emails to`,
        markAs: c('Action').t`mark emails as`,
        autoReply: c('Action').t`send auto-reply email`,
    };

    const { actions } = model;
    const labelsMap = toMap(labels, 'Name');

    const actionsRenderer = (() => {
        const actionsRows = [];

        if (actions.labelAs.labels.length) {
            const labelsTitles = actions.labelAs.labels.map((l, i) => {
                return i > 0 ? c('Label').t` and ${l}` : l;
            });
            const labelsElements = actions.labelAs.labels.map((l, i) => {
                const label = labelsMap[l];
                if (!label) {
                    return null;
                }
                return (
                    <Fragment key={l}>
                        {i > 0 && c('Label').t` and `}
                        {isOpen ? (
                            <span className="mb-2">
                                <LabelStack
                                    labels={[
                                        {
                                            name: label.Name,
                                            color: label.Color,
                                            title: label.Name,
                                        },
                                    ]}
                                />
                            </span>
                        ) : (
                            <strong>{l}</strong>
                        )}
                    </Fragment>
                );
            });

            actionsRows.push({
                element: (
                    <span>
                        {LABELS_ACTION.labelAs}
                        {` `}
                        {labelsElements}
                    </span>
                ),
                title: `${LABELS_ACTION.labelAs} ${labelsTitles}`,
            });
        }

        if (actions.moveTo.folder) {
            const isDefault = ['archive', 'inbox', 'spam', 'trash'].includes(actions.moveTo.folder);
            const defaultFolders = getDefaultFolders();
            const selectedFolder = isDefault
                ? defaultFolders.find((f) => f.value === actions.moveTo.folder)?.text
                : folders.find((f) => f.Path === actions.moveTo.folder)?.Name;

            const folderElement = isOpen ? (
                <span className="inline-flex flex-row items-center condition-token mb-2 max-w-full" role="listitem">
                    <span className="text-ellipsis text-no-decoration" title={selectedFolder}>
                        {selectedFolder}
                    </span>
                </span>
            ) : (
                <strong>{selectedFolder}</strong>
            );

            actionsRows.push({
                element: (
                    <>
                        {LABELS_ACTION.moveTo}
                        {` `}
                        {folderElement}
                    </>
                ),
                title: `${LABELS_ACTION.moveTo} ${selectedFolder}`,
            });
        }

        if (actions.markAs.read || actions.markAs.starred) {
            const readElement = isOpen ? (
                <span className="inline-flex flex-row items-center condition-token mb-2 max-w-full" role="listitem">
                    <span className="text-ellipsis text-no-decoration">{c('Filter preview').t`read`}</span>
                </span>
            ) : (
                <strong>{c('Filter preview').t`read`}</strong>
            );
            const starredElement = isOpen ? (
                <span className="inline-flex flex-row items-center condition-token mb-2 max-w-full" role="listitem">
                    <span className="text-ellipsis text-no-decoration">{c('Filter preview').t`starred`}</span>
                </span>
            ) : (
                <strong>{c('Filter preview').t`starred`}</strong>
            );

            const markAsTitle = `${actions.markAs.read && c('Filter preview').t`read`}${
                actions.markAs.read && actions.markAs.starred && ` ${c('Label').t`and`} `
            }${actions.markAs.starred && c('Filter preview').t`starred`}`;

            actionsRows.push({
                element: (
                    <>
                        {LABELS_ACTION.markAs}
                        {` `}
                        {actions.markAs.read && readElement}
                        {actions.markAs.read && actions.markAs.starred && (
                            <>
                                {` `}
                                {c('Label').t`and`}
                                {` `}
                            </>
                        )}
                        {actions.markAs.starred && starredElement}
                    </>
                ),
                title: `${LABELS_ACTION.markAs} ${markAsTitle}`,
            });
        }

        if (actions.autoReply) {
            const label = isOpen ? (
                <span className="inline-flex flex-row items-center condition-token mb-2 max-w-full" role="listitem">
                    <span className="text-no-decoration max-w-custom" style={{ '--max-w-custom': 'inherit' }}>
                        {LABELS_ACTION.autoReply}
                    </span>
                </span>
            ) : (
                <strong>{LABELS_ACTION.autoReply}</strong>
            );

            actionsRows.push({
                element: label,
                title: LABELS_ACTION.autoReply,
            });
        }

        const title: string = actionsRows.reduce((acc, action, i) => {
            acc += i === 0 ? c('Label').t`Then` : ` ${c('Label').t`and`}`;
            return `${acc} ${action.title}`;
        }, '');

        return isOpen ? (
            <div className="pt-2 max-w-full">
                {actionsRows.map((action, i) => (
                    <div key={`preview-action-${i}`}>
                        {i === 0 ? c('Label').t`Then` : c('Label').t`And`}
                        {` `}
                        {action.element}
                    </div>
                ))}
            </div>
        ) : (
            <div className="max-w-full text-ellipsis" title={title}>
                {actionsRows.map((action, i) => (
                    <span key={`preview-action-${i}`}>
                        {i === 0 ? c('Label').t`Then` : ` ${c('Label').t`and`}`}
                        {` `}
                        {action.element}
                    </span>
                ))}
            </div>
        );
    })();

    return (
        <div className="border-bottom mb-8">
            <div className="flex flex-nowrap flex-column md:flex-row align-items-center py-4 gap-4">
                <button type="button" className="w-full md:w-1/4 text-left" onClick={toggleOpen}>
                    <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                    <span className="ml-2">{c('Label').t`Actions`}</span>
                </button>
                <div className="flex flex-column w-full">{actionsRenderer}</div>
            </div>
        </div>
    );
};

export default FilterPreviewActions;
