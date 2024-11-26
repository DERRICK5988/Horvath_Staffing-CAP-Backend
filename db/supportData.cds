using {User} from '@sap/cds/common';

aspect customManaged {
    CreatedAt  : Timestamp @cds.on.insert : $now;
    CreatedBy  : User      @cds.on.insert : $user;
    ModifiedAt : Timestamp @cds.on.insert : $now
                           @cds.on.update : $now;
    ModifiedBy : User      @cds.on.insert : $user
                           @cds.on.update : $user;
}
