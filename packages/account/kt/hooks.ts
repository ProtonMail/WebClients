import { useSelector } from '../store/hooks';
import { selectKTActivation, selectKTSelfAuditResult, selectKTSelfAuditStatus } from './index';

export const useKTActivation = () => {
    return useSelector(selectKTActivation);
};

export const useKTSelfAuditResult = () => {
    return useSelector(selectKTSelfAuditResult);
};

export const useKTSelfAuditStatus = () => {
    return useSelector(selectKTSelfAuditStatus);
};
