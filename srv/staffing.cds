using {horvath.btp.staffing as hbs} from '../db';


service StaffingService @(
    path    : '/Staffing'
    //requires: 'StaffingApp'
) {
    entity StaffingData      as projection on hbs.StaffingData;
    entity Project           as projection on hbs.Project;
    entity StaffingToPlanned as projection on hbs.StaffingToPlanned;
    entity PlannedHours      as projection on hbs.PlannedHours;
    entity ActualHours       as projection on hbs.ActualHours;
    entity Totals            as projection on hbs.Totals;

    // @cds.persistence.skip
    entity ActualPlannedDataFourMonths {
        key ProjectID       : String(40);
        key StaffedEmployee : String(8);
            ProjectName     : String(40);
            CustomerName    : String(166);
            PrevMonth1     : Decimal(15, 2);
            Month1          : Decimal(15, 2);
            Month2          : Decimal(15, 2);
            Month3          : Decimal(15, 2);
            Month4          : Decimal(15, 2);
            StartDate       : Date;
            EndDate         : Date;
    };

    action   transferStaffingToPlannedData();
    action   getPersonWorkAgreement(DefaultEmailAddress : String(241)) returns me;

    @odata.singleton
    entity me @cds.persistence.skip {
        key PersonWorkAgreement : String(8);
    }

    @readonly
    entity MyData @cds.persistence.skip {
        key DefaultEmailAddress : String(241);
            PersonWorkAgreement : String(8);
    }

    @readonly
    entity ListOfOnBehalfEmp @cds.persistence.skip {
        key DefaultEmailAddress : String(241);
            PersonWorkAgreement : String(8);
            PersonFullName      : String(80);
    };

    function userInfo()                                                returns String; // using req.user approach (user attribute - of class cds.User - from the request object)
}
