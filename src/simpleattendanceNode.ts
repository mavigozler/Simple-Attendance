import { readFile, writeFile } from "fs/promises";
import columnify from "columnify";
import { parse } from "csv-parse/browser/esm/sync";

import { coreProcessing } from "./simpleattendanceCore";
import type { SessionData, RosterRecord, SessionRecord } from "./types/simpleattendanceTypes";

const rosterFilename = 
   "D:\\Mavigozler GitHub\\mavigozler.github.io\\Teaching\\Chemistry\\Chem 3A Attendance\\Section Rosters.csv",
      attendanceRecordsFilename = 
   "D:\\Mavigozler GitHub\\mavigozler.github.io\\Teaching\\Chemistry\\Chem 3A Attendance\\14 Aug Attendance.csv";

async function processData() {
	let sessionsData: SessionData[],
		report = "";
  	try {
   	const rosterData = await readFile(rosterFilename, 'utf8');
    	const attendanceData = await readFile(attendanceRecordsFilename, 'utf8');
		   report += "Roster.csv raw headers:\n";
		const rosterRecords: RosterRecord[] = parse(rosterData, {
			columns: (header: any) => {
				report += `${header},`;
				return header.map((h: string) => h.trim());
			},
			skip_empty_lines: true,
			cast: (value: string, context: any) => {
				if (context.column == "StudentId")
					return value.length == 6 ? "0" + value : value;
				else if (context.column == "Wait Position")
					return parseInt(value);
				return value;
			}
		});
		
		// Timestamp, Student ID, Attendance Code
		const sessionRecords: SessionRecord[] = parse(attendanceData, {
			columns: true,
			skip_empty_lines: true
		});
		sessionsData = coreProcessing(rosterRecords, sessionRecords, {textReport: report});
	   for (const sessionData of sessionsData) {
			report += 
				"========================" +
				`\nSession Code: ${sessionData.SessionCode}` +
				`\nSession Date: ${sessionData.SessionDate}` +
				`\nSession Type: ${sessionData.SessionType}` +
				"\n----" +
				"\nABSENT\n" +
				(sessionData.Absent.length == 0 ? "--NONE--" : columnify(sessionData.Absent)) +
				"\nPRESENT\n" +
				columnify(sessionData.Present) + "\n\n" ;
   	}
		try {
			await writeFile("../test/Attendance Report.txt", report);
		} catch (exc) {
		    console.error('An exception occurred:', exc);	
		}
	} catch (exc) {
		console.error('An exception occurred:', exc);	
	}
}

processData();