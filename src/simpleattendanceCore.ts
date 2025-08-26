import type {
   RosterRecord, SessionRecord, SessionData, SectionRoster, Section, AttendanceRecord,
   UnmatchedRecord, AbsenceInfo, SessionType
} from "./types/simpleattendanceTypes";

import { parse } from "../node_modules/csv-parse/dist/esm/sync.js";

export function coreProcessing(
   rosterContent: string, 
   attendanceContent: string
): {sessionData: SessionData[], rosterRecords: RosterRecord[] } {

   let report = "";
	const rosterRecords: RosterRecord[] = parse(rosterContent, {
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
	const sessionRecords: SessionRecord[] = parse(attendanceContent, {
		columns: true,
		skip_empty_lines: true
	});

   const sectionRosters: SectionRoster[] = [];
   let prevRecord: Section = "";

   // Section, Name, StudentId, Email, Status
   //  Status: "Enrolled" | "Waitlisted" | "Dropped"

   rosterRecords.sort((a: RosterRecord, b: RosterRecord) => {
      return a.Section > b.Section ? 1 : a.Section < b.Section ? -1 : 0
   });
   let list: RosterRecord[] = [];
   for (const rosRec of rosterRecords) {
      if (prevRecord != rosRec.Section) {
         list = [];
         sectionRosters.push({
            Section: rosRec.Section,
            Roster: list
         });
         prevRecord = rosRec.Section;
      }
      list.push(rosRec);
   }
   report += "\n\n";

   /*
      - Define const 'Present', 'Absent' to be array of object of this type
            Student ID, Name, Section, Class, Date, Waitlisted?
            Class: lecture, Tuesday lab, Thurs lab
      - sort attendance records into Sessions Blocks using Attendance Code
         get the date of Session Block
      - for each Session Block
         initialize a SessionData object
         for each student in the roster
            if an enrolled student is not found, place that student in "Absent"
            if enrolled, waitlisted, and dropped is found, add to "Present"
   */
   const sessionsData: SessionData[] = [],
      sessionBlocks: SessionRecord[][] = [];
   let sessionCode: string = "",
      sessionRecord: SessionRecord | undefined,
      sessionBlock: SessionRecord[] = [],
      present: AttendanceRecord[] = [], 
      absent: AbsenceInfo[] = [],
      unmatched: UnmatchedRecord[] = [],
      sessionType: SessionType,
      sessionDate: string;
   
   sessionRecords.sort((a: any, b: any) => {
      const aValue = a["Attendance Code"], bValue = b["Attendance Code"];
      return aValue > bValue ? aValue < bValue ? -1 : 0 : 1;
   });
   for (const sessionRecord of sessionRecords) {
      if (sessionCode != sessionRecord["Attendance Code"].trim()) {
         sessionBlock = [];
         sessionBlocks.push(sessionBlock);
      }
      sessionCode = sessionRecord["Attendance Code"].trim();
      sessionBlock.push(sessionRecord);
   }
   for (const sessionBlock of sessionBlocks) {
      let sessionRoster: RosterRecord[] = [];
      sessionCode = sessionBlock[0]["Attendance Code"];
      if (sessionCode.search(/THU/) > 0) {
         sessionType = "Thursday Lab";
         sessionRoster = sectionRosters.find(sec => sec.Section == "43958")!.Roster;
      } else if (sessionCode.search(/TUE/) > 0) {
         sessionType = "Tuesday Lab";
         sessionRoster = sectionRosters.find(sec => sec.Section == "43957")!.Roster;
      } else {
         sessionType = "Lecture";
         for (const rec of sectionRosters)
            sessionRoster = sessionRoster.concat(rec.Roster);
      }
      sessionDate = new Date(sessionBlock[0].Timestamp).toLocaleDateString();
      // search session records for enrolled students first
      for (const rosterRecord of sessionRoster)
         if (sessionRecord = sessionBlock.find(blockRec => blockRec["Student ID"] == rosterRecord.StudentId)) {
            if (rosterRecord.Status == "Enrolled" || rosterRecord.Status == "Waitlisted")
               present.push({
                  Timestamp: sessionRecord.Timestamp,
                  StudentID: rosterRecord.StudentId.toString(),
                  Name: rosterRecord.Name,
                  Section: rosterRecord.Section,
                  SessionType: sessionType,
                  WaitlistPosition: isNaN(rosterRecord["Wait Position"]) ? undefined : rosterRecord["Wait Position"]
               });
         } else if (rosterRecord.Status == "Enrolled")
            absent.push({
               StudentID: rosterRecord.StudentId.toString(),
               Name: rosterRecord.Name,
               Email: rosterRecord.Email,
               Section: rosterRecord.Section,
               SessionType: sessionType,
               SessionDate: sessionDate
            });
      // search 
      for (const sessionRecord of sessionBlock)
         if (rosterRecords.find(rosRec =>
            rosRec.StudentId == sessionRecord["Student ID"] //&&
           // rosRec.Status == "Enrolled"
         ))
            continue;
         else
            unmatched.push({
               StudentID: sessionRecord["Student ID"].toString(),
               SessionType: sessionType,
               Timestamp: sessionRecord.Timestamp
            })
      sessionsData.push({
         Headers: {
            present: Object.keys(present[0]),
            absent: Object.keys(absent[0]),
         },
         Present: present,
         Absent: absent,
         Unmatched: unmatched,
         SessionCode: sessionCode,
         SessionType: sessionType,
         SessionDate: sessionDate.toLocaleString()
      });
      present = [];
      absent = [];
      unmatched = [];
   }
   return {sessionData: sessionsData, rosterRecords: rosterRecords};
}