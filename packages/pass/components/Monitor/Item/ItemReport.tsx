import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { ActionCard } from '@proton/pass/components/Layout/Card/ActionCard';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectItemReport } from '@proton/pass/store/selectors/monitor';
import type { SelectedItem } from '@proton/pass/types';

export const ItemReport: FC<SelectedItem> = (item) => {
    const { navigate } = useNavigation();
    const report = useSelector(selectItemReport(item));
    const { duplicates } = report.password;

    return (
        <>
            {duplicates > 1 && (
                <div className="py-4">
                    <ActionCard
                        onClick={() => navigate(getLocalPath('monitor'))}
                        icon="exclamation-filled"
                        title={c('Title').t`Reused passwords`}
                        subtitle={
                            <>
                                <div>
                                    {duplicates < 5
                                        ? c('Description').ngettext(
                                              msgid`${duplicates} other login use this password:`,
                                              `${duplicates} other logins use this password:`,
                                              duplicates
                                          )
                                        : // translator full sentence is "X other login use this password", in this usecase X is allwas >5 and the text "X other login" is displayed as pill
                                          c('Description').jt`${duplicates} other logins use this password`}
                                </div>
                                <div>{c('Description')
                                    .t`Visit the website and generate a unique password for this item.`}</div>
                            </>
                        }
                        pillLabel={duplicates}
                        type="warning"
                    />
                </div>
            )}
        </>
    );
};
