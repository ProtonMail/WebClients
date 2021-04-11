import React from 'react';
import { c } from 'ttag';

import { VIEW_MODE } from 'proton-shared/lib/constants';

import conversationGroupSvg from 'design-system/assets/img/pm-images/conversation-group.svg';
import conversationSingleSvg from 'design-system/assets/img/pm-images/conversation-single.svg';

import { RadioCards } from '../../components';

const { GROUP, SINGLE } = VIEW_MODE;

interface Props {
    viewMode: VIEW_MODE;
    onChange: (viewMode: VIEW_MODE) => void;
    loading: boolean;
    id: string;
}

const ViewModeRadios = ({ viewMode, onChange, loading, id, ...rest }: Props) => {
    const radioCardGroup = {
        value: GROUP,
        checked: viewMode === GROUP,
        id: 'groupRadio',
        disabled: loading,
        name: 'viewMode',
        label: c('Label to change view mode').t`Conversation group`,
        onChange() {
            onChange(GROUP);
        },
        children: <img alt="Group" src={conversationGroupSvg} />,
    };
    const radioCardSingle = {
        value: SINGLE,
        checked: viewMode === SINGLE,
        id: 'singleRadio',
        disabled: loading,
        name: 'viewMode',
        label: c('Label to change view mode').t`Single messages`,
        onChange() {
            onChange(SINGLE);
        },
        children: <img alt="Single" src={conversationSingleSvg} />,
    };

    return <RadioCards list={[radioCardGroup, radioCardSingle]} id={id} {...rest} />;
};

export default ViewModeRadios;
