import type { FC } from 'react';

import type { FormikContextType } from 'formik';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { ScrollableItemsList } from 'proton-pass-extension/app/content/injections/apps/components/ScrollableItemsList';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { AutosaveFormValues, AutosaveUpdatePayload, LoginItemPreview } from '@proton/pass/types';
import { AutosaveMode } from '@proton/pass/types';

type Props = {
    busy: boolean;
    data: AutosaveUpdatePayload;
    form: FormikContextType<AutosaveFormValues>;
};

export const AutosaveSelect: FC<Props> = ({ data, busy, form }) => {
    const onSelect = ({ shareId, itemId, name, userIdentifier }: LoginItemPreview) =>
        form.setValues((values) => ({
            ...values,
            type: AutosaveMode.UPDATE,
            step: 'edit',
            itemId,
            shareId,
            name: name || values.name,
            userIdentifier: userIdentifier || values.userIdentifier,
        }));

    return (
        <>
            <ScrollableItemsList increaseSurface>
                {data.candidates.map((candidate) => (
                    <ListItem
                        key={getItemKey(candidate)}
                        className="rounded-none"
                        icon="user"
                        title={candidate.name}
                        subTitle={candidate.userIdentifier}
                        onClick={() => onSelect(candidate)}
                        url={candidate.url}
                        action={
                            data?.candidates.length > 1 && (
                                <ButtonLike
                                    as="div"
                                    pill
                                    color="norm"
                                    loading={busy}
                                    disabled={busy}
                                    className="flex-auto"
                                    onClick={() => onSelect(candidate)}
                                >{c('Label').t`Update`}</ButtonLike>
                            )
                        }
                    />
                ))}
            </ScrollableItemsList>

            <div className="flex justify-space-between shrink-0 gap-3 mt-1">
                <Button
                    pill
                    color="norm"
                    shape="underline"
                    type="submit"
                    className="text-no-decoration hover:text-underline p-0 pt-1"
                >
                    {c('Action').t`Create new login`}
                </Button>
                {data?.candidates.length === 1 && (
                    <ButtonLike
                        as="div"
                        pill
                        color="norm"
                        loading={busy}
                        disabled={busy}
                        onClick={() => onSelect(data.candidates[0])}
                    >
                        <span className="text-ellipsis">{c('Action').t`Update this login`}</span>
                    </ButtonLike>
                )}
            </div>
        </>
    );
};
