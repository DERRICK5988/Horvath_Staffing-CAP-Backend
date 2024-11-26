const cds = require('@sap/cds');
const moment = require('moment');

const namespace = 'horvath.btp.staffing';

class StaffingService extends cds.ApplicationService {
	async init() {
		const {
			StaffingToPlanned,
			PlannedHours,
			ActualHours,
			ActualPlannedDataFourMonths,
			Totals
		} = this.entities;

		const PersonWAEmailService = await cds.connect.to('YY1_PERSONWAEMAILAPI_CDS_0001');
		const EmployeeAbsenceService = await cds.connect.to('YY1_EMPLOYEEANSENCEAPI_CDS_0001');

		this.on('userInfo', (req) => {
			const user = {
				id: req.user.id,
				tenant: req.user.tenant,
				_roles: req.user._roles,
				attr: req.user.attr
			}

			return user;
		});

		this.on('transferStaffingToPlannedData', async () => {

			const staffingToPlannedData = await SELECT
				.columns([`*`])
				.from(StaffingToPlanned);

			for (let plannedData of staffingToPlannedData) {
				const updateKeys = JSON.parse(JSON.stringify(plannedData));
				delete updateKeys.StaffedEffort;

				try {
					await INSERT.into(PlannedHours).entries(plannedData);
				} catch (e) {
					await UPDATE.entity(PlannedHours, updateKeys).with({
						"StaffedEffort": plannedData.StaffedEffort
					});
				}
			}
		});

		this.on("READ", 'MyData', async (req) => {
			if (!req.data.DefaultEmailAddress) {
				req.reject(501, `Method not implemented.`);
			}

			const email = req.data.DefaultEmailAddress.toLowerCase();
			const s4hcResponse = await PersonWAEmailService.run(SELECT.from('YY1_PersonWAEmailAPI').where({
				EmailAddress: email
			}));

			if (s4hcResponse.length === 0) {
				req.reject(400, `Email address '${email}' is not exist in the System.`)
			} else if (s4hcResponse.length === 1) {
				return {
					DefaultEmailAddress: email,
					PersonWorkAgreement: s4hcResponse[0].PersonWorkAgreement
				};
			} else {
				req.reject(400, `More then 1 Person Work Agreement found. Please contact your System Administrator.`)
			}
		});

		this.on("READ", 'ListOfOnBehalfEmp', async (req) => {
			if (!req._queryOptions) {
				req.reject(400, `Please provide email address.`);
				return;
			}
			var uniqueRecords = [];
			if (req.user.is('StaffingApplicationOnBehalf')) {
				var s4hcEmp = await PersonWAEmailService.run(SELECT.from('YY1_PersonWAEmailAPI')
					.columns('PersonWorkAgreement', 'DefaultEmailAddress', 'PersonFullName', 'EmailAddress'));


				const emailMap = new Map();

				for (const record of s4hcEmp) {
					const key = `${record.EmailAddress}-${record.PersonWorkAgreement}`;
					// if (!emailMap.has(record.EmailAddress)) {
					// 	emailMap.set(record.EmailAddress, record.PersonWorkAgreement,true);
					// 	uniqueRecords.push(record);
					// }
					if (!emailMap.has(key)) {
						emailMap.set(key, true);
						uniqueRecords.push(record);
					}
				}
			} else {
				const EmailQueryIndex = req.query.SELECT.where.findIndex(function (item) {
					return (typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'ref') && item.ref[0] === 'DefaultEmailAddress')
				});
				const Email = req.query.SELECT.where[EmailQueryIndex + 2].val.toLowerCase();

				s4hcEmp = await PersonWAEmailService.run(SELECT.from('YY1_PersonWAEmailAPI')
					.columns('PersonWorkAgreement', 'DefaultEmailAddress', 'PersonFullName', 'EmailAddress').where({
						EmailAddress: Email
					}));
				uniqueRecords = [];

				const emailMap = new Map();
				for (const record of s4hcEmp) {
					if (!emailMap.has(record.EmailAddress)) {
						emailMap.set(record.EmailAddress, true); // Use the email address as a key for uniqueness
						uniqueRecords.push(record);
					}
				}
			}
			if (uniqueRecords.length > 0) {
				return uniqueRecords;
			} else {
				req.reject(400, `No data found.`)
			}
		});

		this.on('getPersonWorkAgreement', async (req) => {
			const email = req.data.DefaultEmailAddress.toLowerCase();
			const s4hcResponse = await PersonWAEmailService.run(SELECT.from('YY1_PersonWAEmailAPI').where({
				EmailAddress: email
			}));

			if (s4hcResponse.length === 0) {
				req.reject(400, `Email address '${email}' is not exist in the System.`)
			} else if (s4hcResponse.length === 1) {
				return {
					PersonWorkAgreement: s4hcResponse[0].PersonWorkAgreement
				};
			} else {
				req.reject(400, `More then 1 Person Work Agreement found. Please contact your System Administrator.`)
			}
		});

		this.on("READ", "Totals", async (req) => {
			const checkResponse = checkIsMandatoryFilterPresent(req._queryOptions);
			if (checkResponse) {
				req.error(400, checkResponse);
				return;
			}

			const {
				where
			} = req.query.SELECT;
			const staffedEmployeeWhereIndex = req.query.SELECT.where.findIndex(function (item) {
				return (typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'ref') && item.ref[0] === 'StaffedEmployee')
			});

			const personWorkAgreement = req.query.SELECT.where[staffedEmployeeWhereIndex + 2].val;

			const totalsResult = await SELECT.from(Totals); //.limit(limit).where(where || {});
			const aggregatedValues = await SELECT.from(`${namespace}.ActualPlannedDataAggregatedView`).where(where || {});

			const datesPeriod = getMonthFilters();

			const s4hcResponse = await EmployeeAbsenceService.run(
				SELECT
					.columns('PersonWorkAgreement', 'FiscalYear', 'FiscalPeriod', 'PersonHours')
					.from('YY1_EmployeeAnsenceAPI')
					.where({
						PersonWorkAgreement: personWorkAgreement,
						and: {
							FiscalYear: datesPeriod.Month1.FiscalYear,
							FiscalPeriod: datesPeriod.Month1.Period,
							or: {
								FiscalYear: datesPeriod.Month2.FiscalYear,
								FiscalPeriod: datesPeriod.Month2.Period,
								or: {
									FiscalYear: datesPeriod.Month3.FiscalYear,
									FiscalPeriod: datesPeriod.Month3.Period,
									or: {
										FiscalYear: datesPeriod.Month4.FiscalYear,
										FiscalPeriod: datesPeriod.Month4.Period,
										or: {
											FiscalYear: datesPeriod.prevMonth1.FiscalYear,
											Period: datesPeriod.prevMonth1.Period
										}
									}
								}
							}
						}
					})
					.orderBy(
						'FiscalYear',
						'FiscalPeriod'
					)
			);
			// Assign Staffed Employee ID
			totalsResult[0].StaffedEmployee = personWorkAgreement;
			totalsResult[1].StaffedEmployee = personWorkAgreement;
			totalsResult[2].StaffedEmployee = personWorkAgreement;
			totalsResult[3].StaffedEmployee = personWorkAgreement;

			// Sum
			totalsResult[0].Month1 = aggregatedValues.length > 0 ? aggregatedValues[0].Month1 : 0;
			totalsResult[0].Month2 = aggregatedValues.length > 0 ? aggregatedValues[0].Month2 : 0;
			totalsResult[0].Month3 = aggregatedValues.length > 0 ? aggregatedValues[0].Month3 : 0;
			totalsResult[0].Month4 = aggregatedValues.length > 0 ? aggregatedValues[0].Month4 : 0;

			if (s4hcResponse.length > 0) {
				// Available Hours
				totalsResult[1].Month1 = s4hcResponse[0] ? s4hcResponse[0].PersonHours : 0;
				totalsResult[1].Month2 = s4hcResponse[1] ? s4hcResponse[1].PersonHours : 0;
				totalsResult[1].Month3 = s4hcResponse[2] ? s4hcResponse[2].PersonHours : 0;
				totalsResult[1].Month4 = s4hcResponse[3] ? s4hcResponse[3].PersonHours : 0;

				// Remaining Hours
				totalsResult[2].Month1 = totalsResult[1].Month1 - totalsResult[0].Month1;
				totalsResult[2].Month2 = totalsResult[1].Month2 - totalsResult[0].Month2;
				totalsResult[2].Month3 = totalsResult[1].Month3 - totalsResult[0].Month3;
				totalsResult[2].Month4 = totalsResult[1].Month4 - totalsResult[0].Month4;

				// Utilization
				totalsResult[3].Month1 = isFinite(totalsResult[0].Month1 / totalsResult[1].Month1) ? (totalsResult[0].Month1 / totalsResult[1].Month1 * 100).toFixed(0) : null;
				totalsResult[3].Month2 = isFinite(totalsResult[0].Month2 / totalsResult[1].Month2) ? (totalsResult[0].Month2 / totalsResult[1].Month2 * 100).toFixed(0) : null;
				totalsResult[3].Month3 = isFinite(totalsResult[0].Month3 / totalsResult[1].Month3) ? (totalsResult[0].Month3 / totalsResult[1].Month3 * 100).toFixed(0) : null;
				totalsResult[3].Month4 = isFinite(totalsResult[0].Month4 / totalsResult[1].Month4) ? (totalsResult[0].Month4 / totalsResult[1].Month4 * 100).toFixed(0) : null;
			}

			return totalsResult;
		});

		this.on("READ", ActualPlannedDataFourMonths, async (req) => {

			let selectQuery;

			if (req.query.SELECT.one) {
				selectQuery = SELECT.from(`${namespace}.ActualPlannedDataFourMonthsView`).where(req.query.SELECT.from.ref[0].where);
			} else {

				const {
					where,
					limit
				} = req.query.SELECT;
				selectQuery = SELECT.from(`${namespace}.ActualPlannedDataFourMonthsView`).limit(limit).where(where || {});
			}

			return selectQuery;
		});

		this.after("CREATE", ActualPlannedDataFourMonths, async (req) => {
			await DELETE.from('StaffingService.ActualPlannedDataFourMonths', req.data);
		});


		this.on("CREATE", ActualPlannedDataFourMonths, async (req, next) => {
			const createEntryData = req.query.INSERT.entries[0];
			const insertEntries = [];

			// Check Incoming values
			if (!checkMonthsValuesExist(createEntryData)) {
				return req.reject(400, `Please fill at least one Month before updating`);
			}

			// Get Project Data
			const projectData = await SELECT.from(`${namespace}.Project`)
				.columns('ProjectID', 'StartDate', 'EndDate')
				.where({
					ProjectID: createEntryData.ProjectID
				});
			if (projectData.length === 0) {
				return req.reject(400, 'Project Data is not replicated yet');
			}

			const projectStartDate = moment(projectData[0].StartDate).startOf('month');
			const projectEndDate = moment(projectData[0].EndDate).endOf('month');

			// First Month
			if (createEntryData.Month1) {
				const yearMonth1 = await SELECT.from(`${namespace}.YearMonth1`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth1)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth1[0].MONTH}/${yearMonth1[0].YEAR}`);
				}
				insertEntries.push({
					ProjectID: createEntryData.ProjectID,
					StaffedEmployee: createEntryData.StaffedEmployee,
					FiscalYear: yearMonth1[0].YEAR,
					Period: yearMonth1[0].MONTH,
					StaffedEffort: createEntryData.Month1
				});
			}

			// Second Month
			if (createEntryData.Month2) {
				const yearMonth2 = await SELECT.from(`${namespace}.YearMonth2`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth2)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth2[0].MONTH}/${yearMonth2[0].YEAR}`);
				}
				insertEntries.push({
					ProjectID: createEntryData.ProjectID,
					StaffedEmployee: createEntryData.StaffedEmployee,
					FiscalYear: yearMonth2[0].YEAR,
					Period: yearMonth2[0].MONTH,
					StaffedEffort: createEntryData.Month2
				});
			}

			// Third Month
			if (createEntryData.Month3) {
				const yearMonth3 = await SELECT.from(`${namespace}.YearMonth3`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth3)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth3[0].MONTH}/${yearMonth3[0].YEAR}`);
				}
				insertEntries.push({
					ProjectID: createEntryData.ProjectID,
					StaffedEmployee: createEntryData.StaffedEmployee,
					FiscalYear: yearMonth3[0].YEAR,
					Period: yearMonth3[0].MONTH,
					StaffedEffort: createEntryData.Month3
				});
			}

			// Fourth Month
			if (createEntryData.Month4) {
				const yearMonth4 = await SELECT.from(`${namespace}.YearMonth4`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth4)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth4[0].MONTH}/${yearMonth4[0].YEAR}`);
				}
				insertEntries.push({
					ProjectID: createEntryData.ProjectID,
					StaffedEmployee: createEntryData.StaffedEmployee,
					FiscalYear: yearMonth4[0].YEAR,
					Period: yearMonth4[0].MONTH,
					StaffedEffort: createEntryData.Month4
				});
			}

			if (insertEntries.length > 0) {
				await INSERT.into(ActualHours).entries(insertEntries);
			}

			return next();
		});

		this.on("UPDATE", ActualPlannedDataFourMonths, async (req) => {
			const updateEntryData = req.query.UPDATE.data;

			// Check Incoming values
			if (!checkMonthsValuesExist(updateEntryData)) {
				return req.reject(400, `Please fill at least one Month before updating`);
			}

			// Get Project Data
			const projectData = await SELECT.from(`${namespace}.Project`)
				.columns('ProjectID', 'StartDate', 'EndDate')
				.where({
					ProjectID: updateEntryData.ProjectID
				});

			const projectStartDate = moment(projectData[0].StartDate).startOf('month');
			const projectEndDate = moment(projectData[0].EndDate).endOf('month');

			// First Month
			if (updateEntryData.Month1) {
				const yearMonth1 = await SELECT.from(`${namespace}.YearMonth1`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth1)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth1[0].MONTH}/${yearMonth1[0].YEAR}`);
				}
				const entryKey1 = {
					ProjectID: updateEntryData.ProjectID,
					StaffedEmployee: updateEntryData.StaffedEmployee,
					FiscalYear: yearMonth1[0].YEAR,
					Period: yearMonth1[0].MONTH
				};
				const entryEffort1 = {
					StaffedEffort: updateEntryData.Month1
				};

				const recordExist1 = await SELECT.from(ActualHours, entryKey1);
				if (recordExist1) {
					await UPDATE.entity(ActualHours, entryKey1).with(entryEffort1);
				} else {
					await INSERT.into(ActualHours).entries(Object.assign(entryKey1, entryEffort1));
				}
			}

			// Second Month
			if (updateEntryData.Month2) {
				const yearMonth2 = await SELECT.from(`${namespace}.YearMonth2`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth2)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth2[0].MONTH}/${yearMonth2[0].YEAR}`);
				}
				const entryKey2 = {
					ProjectID: updateEntryData.ProjectID,
					StaffedEmployee: updateEntryData.StaffedEmployee,
					FiscalYear: yearMonth2[0].YEAR,
					Period: yearMonth2[0].MONTH
				};
				const entryEffort2 = {
					StaffedEffort: updateEntryData.Month2
				};

				const recordExist2 = await SELECT.from(ActualHours, entryKey2);
				if (recordExist2) {
					await UPDATE.entity(ActualHours, entryKey2).with(entryEffort2);
				} else {
					await INSERT.into(ActualHours).entries(Object.assign(entryKey2, entryEffort2));
				}
			}

			// Third Month
			if (updateEntryData.Month3) {
				const yearMonth3 = await SELECT.from(`${namespace}.YearMonth3`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth3)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth3[0].MONTH}/${yearMonth3[0].YEAR}`);
				}
				const entryKey3 = {
					ProjectID: updateEntryData.ProjectID,
					StaffedEmployee: updateEntryData.StaffedEmployee,
					FiscalYear: yearMonth3[0].YEAR,
					Period: yearMonth3[0].MONTH
				};
				const entryEffort3 = {
					StaffedEffort: updateEntryData.Month3
				};

				const recordExist3 = await SELECT.from(ActualHours, entryKey3);
				if (recordExist3) {
					await UPDATE.entity(ActualHours, entryKey3).with(entryEffort3);
				} else {
					await INSERT.into(ActualHours).entries(Object.assign(entryKey3, entryEffort3));
				}
			}

			// Forth Month
			if (updateEntryData.Month4) {
				const yearMonth4 = await SELECT.from(`${namespace}.YearMonth4`);
				if (!checkMonthDate(projectStartDate, projectEndDate, yearMonth4)) {
					return req.reject(400, `Project either not started or already ended for ${yearMonth4[0].MONTH}/${yearMonth4[0].YEAR}`);
				}
				const entryKey4 = {
					ProjectID: updateEntryData.ProjectID,
					StaffedEmployee: updateEntryData.StaffedEmployee,
					FiscalYear: yearMonth4[0].YEAR,
					Period: yearMonth4[0].MONTH
				};
				const entryEffort4 = {
					StaffedEffort: updateEntryData.Month4
				};

				const recordExist4 = await SELECT.from(ActualHours, entryKey4);
				if (recordExist4) {
					await UPDATE.entity(ActualHours, entryKey4).with(entryEffort4);
				} else {
					await INSERT.into(ActualHours).entries(Object.assign(entryKey4, entryEffort4));
				}
			}

			return;
		});

		this.on("DELETE", ActualPlannedDataFourMonths, async (req) => {
			const datesPeriod = getMonthFilters();

			await DELETE.from(ActualHours).where({
				ProjectID: req.data.ProjectID,
				StaffedEmployee: req.data.StaffedEmployee,
				and: {
					FiscalYear: datesPeriod.Month1.FiscalYear,
					Period: datesPeriod.Month1.Period,
					or: {
						FiscalYear: datesPeriod.Month2.FiscalYear,
						Period: datesPeriod.Month2.Period,
						or: {
							FiscalYear: datesPeriod.Month3.FiscalYear,
							Period: datesPeriod.Month3.Period,
							or: {
								FiscalYear: datesPeriod.Month4.FiscalYear,
								Period: datesPeriod.Month4.Period,
								or: {
									FiscalYear: datesPeriod.prevMonth1.FiscalYear,
									Period: datesPeriod.prevMonth1.Period
								}
							}
						}
					}
				}
			});

			return;
		});

		return super.init();
	}
}

function checkIsMandatoryFilterPresent(queryOptions) {
	let errorMessage;
	const whereClause = queryOptions && queryOptions.$filter;

	if (!whereClause) {
		errorMessage = "Mandatory filter for 'StaffedEmployee' is missing";
		return errorMessage;
	}

	const conditionCheck1 = (whereClause.match(/StaffedEmployee/g) || []).length;
	const conditionCheck2 = (whereClause.match(/StaffedEmployee eq/g) || []).length;

	if (conditionCheck1 === 0) {
		errorMessage = "Mandatory filter for 'StaffedEmployee' is missing";
	} else if (conditionCheck1 > 1) {
		errorMessage = "Filter for 'StaffedEmployee' can be applied only once";
	} else if (conditionCheck1 === 1 && conditionCheck2 !== 1) {
		errorMessage = "Only EQ sign is allowed for 'StaffedEmployee' filter";
	}

	return errorMessage;
}

function getMonthFilters() {
	const currentJSDate = new Date();
	const prevMonth1 = moment(currentJSDate).startOf('month').subtract(1, 'M')
	const monthDate1 = moment(currentJSDate).startOf('month');
	const monthDate2 = moment(currentJSDate).startOf('month').add(1, 'M');
	const monthDate3 = moment(currentJSDate).startOf('month').add(2, 'M');
	const monthDate4 = moment(currentJSDate).startOf('month').add(3, 'M');

	return {
		prevMonth1: {
			FiscalYear: prevMonth1.format('YYYY'),
			Period: prevMonth1.format('M').padStart(3, '0')
		},
		Month1: {
			FiscalYear: monthDate1.format('YYYY'),
			Period: monthDate1.format('M').padStart(3, '0')
		},
		Month2: {
			FiscalYear: monthDate2.format('YYYY'),
			Period: monthDate2.format('M').padStart(3, '0')
		},
		Month3: {
			FiscalYear: monthDate3.format('YYYY'),
			Period: monthDate3.format('M').padStart(3, '0')
		},
		Month4: {
			FiscalYear: monthDate4.format('YYYY'),
			Period: monthDate4.format('M').padStart(3, '0')
		}
	};
}

function checkMonthDate(projectStartDate, projectEndDate, yearMonth) {
	const compareDate = moment(`${parseInt(yearMonth[0].MONTH)}/01/${yearMonth[0].YEAR}`, 'MM/DD/YYYY');

	return compareDate.isBetween(projectStartDate, projectEndDate, undefined, '[]');
}

function checkMonthsValuesExist(entryData) {
	let isMonth1Exist = false;
	let isMonth2Exist = false;
	let isMonth3Exist = false;
	let isMonth4Exist = false;

	if (entryData.Month1) {
		isMonth1Exist = true;
	}
	if (entryData.Month2) {
		isMonth2Exist = true;
	}
	if (entryData.Month3) {
		isMonth3Exist = true;
	}
	if (entryData.Month4) {
		isMonth4Exist = true;
	}

	return isMonth1Exist || isMonth2Exist || isMonth3Exist || isMonth4Exist;
}


module.exports = {
	StaffingService
}