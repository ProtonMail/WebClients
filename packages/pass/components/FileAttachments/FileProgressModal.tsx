import type { FC, ReactNode } from 'react';

import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader, Progress } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';

type FileProgressModalProps = {
    action?: ReactNode;
    message?: ReactNode;
    progress: number;
    title: string;
};

export const FileProgressModal: FC<FileProgressModalProps> = ({ action, message, progress, title }) => (
    <PassModal open size="small">
        <ModalTwoHeader className="text-sm" title={title} hasClose={false} />
        <ModalTwoContent>
            {message || (
                <div className="flex flex-nowrap items-center gap-3 mt-2">
                    <Progress className="progress-bar--norm is-thin" value={progress} />
                    <div className="text-xs">{progress}%</div>
                </div>
            )}
        </ModalTwoContent>
        {action && (
            <ModalTwoFooter>
                <div className="flex gap-2">{action}</div>
            </ModalTwoFooter>
        )}
    </PassModal>
);
