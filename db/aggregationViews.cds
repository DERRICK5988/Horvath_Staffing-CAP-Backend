using {horvath.btp.staffing as hbs} from './schema';

namespace horvath.btp.staffing;


view StaffingToPlanned as
    select from hbs.StaffingData distinct {
        key ProjectID,
        key Period,
        key FiscalYear,
        key StaffedEmployee,
            cast(
                round(
                    SUM(StaffedEffort) over(
                        partition by ProjectID, Period, FiscalYear, StaffedEmployee
                    ), 2
                ) as             Decimal(15, 2)
            ) as StaffedEffort : Decimal(15, 2)
    };

view PlannedDataFourMonths1 as
    select from hbs.PlannedHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month1 : Decimal(15, 2)
    }
    where
        //     FiscalYear = '2022'
        // and Period     = '012';
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth1
        );

view PlannedDataFourMonths2 as
    select from hbs.PlannedHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month2 : Decimal(15, 2)
    }
    where
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth2
        );

view PlannedDataFourMonths3 as
    select from hbs.PlannedHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month3 : Decimal(15, 2)
    }
    where
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth3
        );

view PlannedDataFourMonths4 as
    select from hbs.PlannedHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month4 : Decimal(15, 2)
    }
    where
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth4
        );


view PlannedDataFourMonths as
    select from hbs.PlannedHours
    left join (
        select from hbs.PlannedDataFourMonths1 {
            ProjectID,
            StaffedEmployee,
            Month1
        }
    ) as PlannedDataFourMonths1
        on  PlannedHours.ProjectID       = PlannedDataFourMonths1.ProjectID
        and PlannedHours.StaffedEmployee = PlannedDataFourMonths1.StaffedEmployee
    left join (
        select from hbs.PlannedDataFourMonths2 {
            ProjectID,
            StaffedEmployee,
            Month2
        }
    ) as PlannedDataFourMonths2
        on  PlannedHours.ProjectID       = PlannedDataFourMonths2.ProjectID
        and PlannedHours.StaffedEmployee = PlannedDataFourMonths2.StaffedEmployee
    left join (
        select from hbs.PlannedDataFourMonths3 {
            ProjectID,
            StaffedEmployee,
            Month3
        }
    ) as PlannedDataFourMonths3
        on  PlannedHours.ProjectID       = PlannedDataFourMonths3.ProjectID
        and PlannedHours.StaffedEmployee = PlannedDataFourMonths3.StaffedEmployee
    left join (
        select from hbs.PlannedDataFourMonths4 {
            ProjectID,
            StaffedEmployee,
            Month4
        }
    ) as PlannedDataFourMonths4
        on  PlannedHours.ProjectID       = PlannedDataFourMonths4.ProjectID
        and PlannedHours.StaffedEmployee = PlannedDataFourMonths4.StaffedEmployee
    distinct {
        key PlannedHours.ProjectID,
        key PlannedHours.StaffedEmployee,
            Month1,
            Month2,
            Month3,
            Month4
    };


view ActualDataFourMonths1 as
    select from hbs.ActualHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month1 : Decimal(15, 2)
    }
    where
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth1
        );

view ActualDataFourMonths2 as
    select from hbs.ActualHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month2 : Decimal(15, 2)
    }
    where
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth2
        );

view ActualDataFourMonths3 as
    select from hbs.ActualHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month3 : Decimal(15, 2)
    }
    where
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth3
        );

view ActualDataFourMonths4 as
    select from hbs.ActualHours distinct

    {
        key ProjectID,
        key StaffedEmployee,
            SUM(StaffedEffort) over(
                partition by ProjectID, StaffedEmployee
            ) as Month4 : Decimal(15, 2)
    }
    where
        (
            FiscalYear, Period
        ) in (
            select from hbs.YearMonth4
        );

view ActualDataUnionProjects as
        select from hbs.ActualDataFourMonths1 distinct {
            ProjectID,
            StaffedEmployee
        }
    union all
        select from hbs.ActualDataFourMonths2 distinct {
            ProjectID,
            StaffedEmployee
        }
    union all
        select from hbs.ActualDataFourMonths3 distinct {
            ProjectID,
            StaffedEmployee
        }
    union all
        select from hbs.ActualDataFourMonths4 distinct {
            ProjectID,
            StaffedEmployee
        };

view ActualDataFourMonths as
    select from hbs.ActualDataUnionProjects
    left join (
        select from hbs.ActualDataFourMonths1 {
            ProjectID,
            StaffedEmployee,
            Month1
        }
    ) as ActualDataFourMonths1
        on  ActualDataUnionProjects.ProjectID       = ActualDataFourMonths1.ProjectID
        and ActualDataUnionProjects.StaffedEmployee = ActualDataFourMonths1.StaffedEmployee
    left join (
        select from hbs.ActualDataFourMonths2 {
            ProjectID,
            StaffedEmployee,
            Month2
        }
    ) as ActualDataFourMonths2
        on  ActualDataUnionProjects.ProjectID       = ActualDataFourMonths2.ProjectID
        and ActualDataUnionProjects.StaffedEmployee = ActualDataFourMonths2.StaffedEmployee
    left join (
        select from hbs.ActualDataFourMonths3 {
            ProjectID,
            StaffedEmployee,
            Month3
        }
    ) as ActualDataFourMonths3
        on  ActualDataUnionProjects.ProjectID       = ActualDataFourMonths3.ProjectID
        and ActualDataUnionProjects.StaffedEmployee = ActualDataFourMonths3.StaffedEmployee
    left join (
        select from hbs.ActualDataFourMonths4 {
            ProjectID,
            StaffedEmployee,
            Month4
        }
    ) as ActualDataFourMonths4
        on  ActualDataUnionProjects.ProjectID       = ActualDataFourMonths4.ProjectID
        and ActualDataUnionProjects.StaffedEmployee = ActualDataFourMonths4.StaffedEmployee
    distinct {
        key ActualDataUnionProjects.ProjectID,
        key ActualDataUnionProjects.StaffedEmployee,
            Month1,
            Month2,
            Month3,
            Month4
    };

view PlannedDataExcludingEmpty as
    select from hbs.PlannedDataFourMonths {
        *
    }
    where
        not(
                Month1 is null
            and Month2 is null
            and Month3 is null
            and Month4 is null
        );

view ActualDataExcludingEmpty as
    select from hbs.ActualDataFourMonths {
        *
    };
// where
//     not(
//             Month1 is null
//         and Month2 is null
//         and Month3 is null
//         and Month4 is null
//     );


view UnionPlannedActualProjectEmployee as
//     select from hbs.PlannedDataExcludingEmpty {
//         ProjectID,
//         StaffedEmployee
//     }
// union
    select from hbs.ActualDataExcludingEmpty {
        ProjectID,
        StaffedEmployee
    };

view ActualPlannedDataFourMonthsView as
    select from hbs.UnionPlannedActualProjectEmployee
    left join (
        select from hbs.ActualDataExcludingEmpty {
            ProjectID,
            StaffedEmployee,
            Month1,
            Month2,
            Month3,
            Month4
        }
    ) as ActualDataExcludingEmpty
        on  UnionPlannedActualProjectEmployee.ProjectID       = ActualDataExcludingEmpty.ProjectID
        and UnionPlannedActualProjectEmployee.StaffedEmployee = ActualDataExcludingEmpty.StaffedEmployee
    // left join (
    //     select from hbs.PlannedDataExcludingEmpty {
    //         ProjectID,
    //         StaffedEmployee,
    //         Month1,
    //         Month2,
    //         Month3,
    //         Month4
    //     }
    // ) as PlannedDataExcludingEmpty
    //     on  UnionPlannedActualProjectEmployee.ProjectID       = PlannedDataExcludingEmpty.ProjectID
    //     and UnionPlannedActualProjectEmployee.StaffedEmployee = PlannedDataExcludingEmpty.StaffedEmployee
    left join (
        select from hbs.Project
    ) as ProjectData
        on UnionPlannedActualProjectEmployee.ProjectID = ProjectData.ProjectID
    {
        key UnionPlannedActualProjectEmployee.ProjectID,
            ProjectName,
            CustomerName,
        key UnionPlannedActualProjectEmployee.StaffedEmployee,
            // case
            //     when
            //         ActualDataExcludingEmpty.Month1 is not null
            //     then
            //         ActualDataExcludingEmpty.Month1
            //     else
            //         PlannedDataExcludingEmpty.Month1
            // end   as Month1   : Decimal(15, 2),
            ActualDataExcludingEmpty.Month1 : Decimal(15, 2),
            // case
            //     when
            //         ActualDataExcludingEmpty.Month2 is not null
            //     then
            //         ActualDataExcludingEmpty.Month2
            //     else
            //         PlannedDataExcludingEmpty.Month2
            // end   as Month2   : Decimal(15, 2),
            ActualDataExcludingEmpty.Month2 : Decimal(15, 2),
            // case
            //     when
            //         ActualDataExcludingEmpty.Month3 is not null
            //     then
            //         ActualDataExcludingEmpty.Month3
            //     else
            //         PlannedDataExcludingEmpty.Month3
            // end   as Month3   : Decimal(15, 2),
            ActualDataExcludingEmpty.Month3 : Decimal(15, 2),
            // case
            //     when
            //         ActualDataExcludingEmpty.Month4 is not null
            //     then
            //         ActualDataExcludingEmpty.Month4
            //     else
            //         PlannedDataExcludingEmpty.Month4
            // end   as Month4   : Decimal(15, 2),
            ActualDataExcludingEmpty.Month4 : Decimal(15, 2),
            // false as Editable               : Boolean,
            StartDate,
            EndDate
    };

view ActualPlannedDataAggregatedView as
    select from hbs.ActualPlannedDataFourMonthsView distinct {
        key StaffedEmployee,
            cast(
                IFNULL(
                    SUM(Month1) over(
                        partition by StaffedEmployee
                    ), 0
                ) as      Decimal(15, 2)
            ) as Month1 : Decimal(15, 2),
            cast(
                IFNULL(
                    SUM(Month2) over(
                        partition by StaffedEmployee
                    ), 0
                ) as      Decimal(15, 2)
            ) as Month2 : Decimal(15, 2),
            cast(
                IFNULL(
                    SUM(Month3) over(
                        partition by StaffedEmployee
                    ), 0
                ) as      Decimal(15, 2)
            ) as Month3 : Decimal(15, 2),
            cast(
                IFNULL(
                    SUM(Month4) over(
                        partition by StaffedEmployee
                    ), 0
                ) as      Decimal(15, 2)
            ) as Month4 : Decimal(15, 2)
    };


view Totals as
        select from hbs.DUMMY {
            key 1                  as Position                                                                          : Integer,
                'Project Assigned' as PositionText                                                                      : String(100),
            key null               as StaffedEmployee                                                                   : String(8),
                null               as Month1                                                                            : Decimal(15, 2),
                null               as Month2                                                                            : Decimal(15, 2),
                null               as Month3                                                                            : Decimal(15, 2),
                null               as Month4                                                                            : Decimal(15, 2),
                false              as SetColor                                                                          : Boolean
        }
    union all
        select from hbs.DUMMY distinct {
            key 2                                                                                    as Position        : Integer,
                'Available Days Net (excl. e.g. public holidays, vacation, sick leave from WorkDay)' as PositionText    : String(100),
            key null                                                                                 as StaffedEmployee : String(8),
                null                                                                                 as Month1          : Decimal(15, 2),
                null                                                                                 as Month2          : Decimal(15, 2),
                null                                                                                 as Month3          : Decimal(15, 2),
                null                                                                                 as Month4          : Decimal(15, 2),
                false                                                                                as SetColor        : Boolean

        }
    union all
        select from hbs.DUMMY distinct {
            key 3                as Position                                                                            : Integer,
                'Remaining Days' as PositionText                                                                        : String(100),
            key null             as StaffedEmployee                                                                     : String(8),
                null             as Month1                                                                              : Decimal(15, 2),
                null             as Month2                                                                              : Decimal(15, 2),
                null             as Month3                                                                              : Decimal(15, 2),
                null             as Month4                                                                              : Decimal(15, 2),
                false            as SetColor                                                                            : Boolean
        }
    union all
        select from hbs.DUMMY distinct {
            key 4                 as Position                                                                           : Integer,
                'Utilization (%)' as PositionText                                                                       : String(100),
            key null              as StaffedEmployee                                                                    : String(8),
                null              as Month1                                                                             : Decimal(15, 2),
                null              as Month2                                                                             : Decimal(15, 2),
                null              as Month3                                                                             : Decimal(15, 2),
                null              as Month4                                                                             : Decimal(15, 2),
                false             as SetColor                                                                           : Boolean
        };


// DATE DIMENSION TRANSFORMATIONS

view TimeDimWithCurDateIndicator as
    select from hbs.M_TIME_DIMENSION as TD
    left join (
        select from hbs.DUMMY {
            current_date as CUR_DATE
        }
    ) as CD
        on TD.DATE_SQL = CD.CUR_DATE
    distinct {
        key TD.DATE_SQL,
            TD.YEAR,
            TD.MONTH,
            case
                when
                    CD.CUR_DATE is not null
                then
                    TRUE
                else
                    FALSE
            end as CurrentDateIndicator : Boolean
    };

view YearMonthCurrentDate as
    select from hbs.TimeDimWithCurDateIndicator {
        key YEAR,
        key MONTH,
            true as CurrentYearMonthIndicator : Boolean
    }
    where
        CurrentDateIndicator = true;

view UniqueYearMonth as
    select from hbs.M_TIME_DIMENSION distinct {
        YEAR,
        MONTH
    };

view AllYearMonthRowNumber as
    select from hbs.UniqueYearMonth as UYM
    left join (
        select from hbs.YearMonthCurrentDate {
            YEAR,
            MONTH,
            CurrentYearMonthIndicator
        }
    ) as YMCD
        on  UYM.YEAR  = YMCD.YEAR
        and UYM.MONTH = YMCD.MONTH
    {
        key UYM.YEAR,
        key '0' || UYM.MONTH as MONTH     : String(3),
            ROW_NUMBER() over(
                order by UYM.YEAR, UYM.MONTH
            )                as RowNumber : Integer,
            CurrentYearMonthIndicator

    };

view Month1RowNumber as
    select from hbs.AllYearMonthRowNumber {
        RowNumber as Month1RowNumber : Integer
    }
    where
        CurrentYearMonthIndicator = true;

view Month2RowNumber as
    select from hbs.AllYearMonthRowNumber {
        RowNumber + 1 as Month2RowNumber : Integer
    }
    where
        CurrentYearMonthIndicator = true;

view Month3RowNumber as
    select from hbs.AllYearMonthRowNumber {
        RowNumber + 2 as Month3RowNumber : Integer
    }
    where
        CurrentYearMonthIndicator = true;

view Month4RowNumber as
    select from hbs.AllYearMonthRowNumber {
        RowNumber + 3 as Month4RowNumber : Integer
    }
    where
        CurrentYearMonthIndicator = true;

view YearMonth1 as
    select from hbs.AllYearMonthRowNumber {
        YEAR,
        MONTH
    }
    where
        RowNumber in (
            select from hbs.Month1RowNumber
        );

view YearMonth2 as
    select from hbs.AllYearMonthRowNumber {
        YEAR,
        MONTH
    }
    where
        RowNumber in (
            select from hbs.Month2RowNumber
        );

view YearMonth3 as
    select from hbs.AllYearMonthRowNumber {
        YEAR,
        MONTH
    }
    where
        RowNumber in (
            select from hbs.Month3RowNumber
        );

view YearMonth4 as
    select from hbs.AllYearMonthRowNumber {
        YEAR,
        MONTH
    }
    where
        RowNumber in (
            select from hbs.Month4RowNumber
        );

view Test as
    select from hbs.AllYearMonthRowNumber {
        YEAR,
        MONTH
    }
    where
        RowNumber in (
            select from hbs.Month4RowNumber
        );
//--------------------------------------------------
