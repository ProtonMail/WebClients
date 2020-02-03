export interface Domain {
    ID: string;
    DomainName: string;
    VerifyCode: string;
    DkimPublicKey: string;
    State: number; // 0 is default, 1 is active (verified), 2 is warn (dns issue)
    CheckTime: number;
    LastActiveTime: number;
    WarnTime: number;
    VerifyState: number; // 0 is default, 1 is has code but wrong, 2 is good
    MxState: number; // 0 is default, 1 is set but no us, 2 has us but priority is wrong, 3 is good
    SpfState: number; // 0 is default, 1 and 2 means detected a record but wrong, 3 is good
    DkimState: number; // 0 is default, 1 and 2 means detected record but wrong, 3 means key is wrong, 4 is good, 5 is turned off by user through DNS
    DmarcState: number; // 0 is default, 1 and 2 means detected record but wrong, 3 is good
}
