using {horvath.btp.staffing as hbs} from '../db';


service StaffingDataExportService @(
    path    : '/StaffingDataExport',
    requires: 'StaffingDataExport'
) {
    @readonly
    entity ActualHours  as projection on hbs.ActualHours {
        ProjectID,
        FiscalYear,
        Period,
        StaffedEmployee,
        StaffedEffort
    };

    @readonly
    entity StaffingData as projection on hbs.StaffingData;
}
