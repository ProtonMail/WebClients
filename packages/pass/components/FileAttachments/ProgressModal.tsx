import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader, Progress } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';

type Props = {
    message?: ReactNode;
    progress: number;
    title: string;
    onCancel: () => void;
};

export const ProgressModal: FC<Props> = ({ message, progress, title, onCancel }) => (
    <PassModal open size="small">
        <ModalTwoHeader className="text-sm" title={title} hasClose={false} />
        <ModalTwoContent className="flex flex-column gap-6">
            <span>{message}</span>
            <div className="flex flex-nowrap items-center gap-3">
                <Progress className="progress-bar--norm is-thin" value={progress} />
                <div className="text-xs">{progress}%</div>
            </div>
        </ModalTwoContent>

        <ModalTwoFooter>
            <Button shape="outline" color="danger" pill onClick={onCancel}>
                {c('Action').t`Cancel`}
            </Button>
        </ModalTwoFooter>
    </PassModal>
);
