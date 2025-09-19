import type { FC } from 'react';

import { ImportButton } from 'proton-authenticator/app/components/Settings/Import/ImportButton';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { EmptyPlaceholderImage } from './EmptyPlaceholderImage';

type Props = {
    handleNewClick: () => void;
    searchHasNoResult: boolean;
};

export const EmptyItemPlaceholder: FC<Props> = ({ handleNewClick, searchHasNoResult }) => {
    return (
        <div className={clsx('flex justify-center items-center w-full m-auto pt-8 pb-14 min-h-full')}>
            <div className="flex flex-column gap-3 text-center">
                {searchHasNoResult ? (
                    <div className="text-lg text-semibold">{c('Label').t`No entries matching your search`}</div>
                ) : (
                    <>
                        <EmptyPlaceholderImage className="m-auto" />

                        <div className="flex flex-column gap-1">
                            <h4 className="text-bold">{c('Title').t`No codes yet`}</h4>
                            <span className="color-weak inline-block mb-2">
                                {c('Info').t`Protect your accounts with an extra layer of security.`}
                            </span>
                        </div>

                        <Button
                            pill
                            shape="solid"
                            color="norm"
                            onClick={handleNewClick}
                            title={c('authenticator-2025:Action').t`Create new code`}
                            className="cta-button"
                        >
                            {c('authenticator-2025:Action').t`Create new code`}
                        </Button>
                        <ImportButton />
                    </>
                )}
            </div>
        </div>
    );
};
