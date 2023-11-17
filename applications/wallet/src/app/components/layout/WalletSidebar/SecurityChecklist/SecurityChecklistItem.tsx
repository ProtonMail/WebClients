import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, SettingsLink } from '@proton/components/components';
import security from '@proton/styles/assets/img/illustrations/security.svg';
import clsx from '@proton/utils/clsx';

import './SecurityChecklistItem.scss';

interface Props {
    label: string;
    done?: boolean;
    loading?: boolean;
    path: string;
}

export const SecurityChecklistItem = ({ label, done, loading, path }: Props) => {
    const commonProps = {
        className: clsx(
            'checklist-item',
            'h-custom flex flex-row px-2 flex-align-items-center flex-justify-space-between text-no-decoration',
            done ? '' : 'cursor-pointer'
        ),
    };

    const child = (
        <>
            <div className="flex flex-row flex-align-items-center">
                <img
                    src={security}
                    className="w-custom mt-1"
                    style={{ '--w-custom': '2rem' }}
                    alt={c('Wallet Sidebar').t`Security`}
                />
                <span className={clsx('ml-2', done ? 'text-strike color-weak' : 'color-norm')}>{label}</span>
            </div>
            {loading ? (
                <CircleLoader />
            ) : (
                <Icon
                    name={done ? 'checkmark-circle-filled' : 'chevron-right'}
                    className={clsx(done ? 'color-success' : 'color-weak')}
                    size={done ? 16 : 20}
                />
            )}
        </>
    );

    if (loading || done) {
        return <div {...commonProps}>{child}</div>;
    }

    return (
        <SettingsLink key={path} path={path} {...commonProps}>
            {child}
        </SettingsLink>
    );
};
