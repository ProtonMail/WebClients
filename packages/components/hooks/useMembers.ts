import { MembersModel } from 'proton-shared/lib/models/membersModel';
import { Member } from 'proton-shared/lib/interfaces';
import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<Member[]>(MembersModel);
