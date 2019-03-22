import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { RadioCards } from 'react-components';
import { VIEW_MODE } from 'proton-shared/lib/constants';
import conversationGroupSvg from 'design-system/assets/img/pm-images/conversation-group.svg';
import conversationSingleSvg from 'design-system/assets/img/pm-images/conversation-single.svg';

const { GROUP, SINGLE } = VIEW_MODE;

const ViewModeRadios = ({ viewMode, onChange, loading }) => {
    const radioCardGroup = {
        value: GROUP,
        checked: viewMode === GROUP,
        id: 'groupRadio',
        disabled: loading,
        name: 'viewMode',
        label: c('Label to change view mode').t`Conversation group`,
        onChange: () => onChange(GROUP),
        children: <img alt="Group" src={conversationGroupSvg} />
    };
    const radioCardSingle = {
        value: SINGLE,
        checked: viewMode === SINGLE,
        id: 'singleRadio',
        disabled: loading,
        name: 'viewMode',
        label: c('Label to change view mode').t`Single messages`,
        onChange: () => onChange(SINGLE),
        children: <img alt="Single" src={conversationSingleSvg} />
    };

    return <RadioCards list={[radioCardGroup, radioCardSingle]} />;
};

ViewModeRadios.propTypes = {
    viewMode: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default ViewModeRadios;
