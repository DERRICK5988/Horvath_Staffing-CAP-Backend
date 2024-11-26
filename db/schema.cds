using {customManaged} from './supportData';

namespace horvath.btp.staffing;

entity StaffingData {
    key ProjectID       : String(40);
    key WorkPackageID   : String(50);
    key Period          : String(3);
    key FiscalYear      : String(4);
    key StaffedEmployee : String(8);
        StaffedEffort   : Decimal(15, 3);
};

entity Project {
    key ProjectID    : String(40);
        ProjectName  : String(40);
        Customer     : String(10);
        CustomerName : String(166);
        StartDate    : Date;
        EndDate      : Date;
}

entity PlannedHours : customManaged {
    key ProjectID       : String(40);
    key FiscalYear      : String(4);
    key Period          : String(3);
    key StaffedEmployee : String(8);
        StaffedEffort   : Decimal(15, 2);
}

entity ActualHours : customManaged {
    key ProjectID       : String(40);
    key FiscalYear      : String(4);
    key Period          : String(3);
    key StaffedEmployee : String(8);
        StaffedEffort   : Decimal(15, 2);
}

entity M_TIME_DIMENSION {
    key DATE_SQL : Date;
        YEAR     : String(4);
        MONTH    : String(2);
        DAY      : String(2);
};

entity DUMMY {
    key Empty : String(1);
}

entity DUMMY2 {
    key Empty : String(1);
}


