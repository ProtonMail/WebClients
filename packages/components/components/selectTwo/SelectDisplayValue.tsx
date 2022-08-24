import React, { Fragment, ReactElement } from 'react';

import { Props as OptionProps } from '../option/Option';

type SelectDisplayValueProps<V> = {
    placeholder?: string;
    selectedChildren: ReactElement<OptionProps<V>>[];
};

export const SelectDisplayValue = <V,>({ selectedChildren, placeholder = '' }: SelectDisplayValueProps<V>) => {
    const displayedValue =
        selectedChildren.length > 0
            ? selectedChildren?.map((child, i, all) => (
                  <Fragment key={child.key}>
                      {child.props.children ?? child.props.title}
                      {`${i === all.length - 1 ? '' : ', '}`}
                  </Fragment>
              ))
            : placeholder;

    return <>{displayedValue}</>;
};
