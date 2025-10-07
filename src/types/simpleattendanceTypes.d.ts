export { SessionData, Section, RosterRecord, SectionRoster, SessionRecord, 
   AttendanceRecord, AbsenceInfo, UnmatchedRecord, SessionType, CsvRecord,
	Status
};

/*declare module "csv-parse/browser/esm/sync" {
  import { Parser } from "csv-parse";
  export function parse(input: string): any[];
} */

//declare module "node-file-dialog";

type SessionType = "Lecture" | "Tuesday Lab" | "Thursday Lab";

type Status = "Enrolled" | "Waitlisted" | "Dropped";

type Section = string; //= "43957" | "43958";

type SessionRecord = {
	Timestamp: Date;
	"Student ID": string;
	"Attendance Code": string;
	Name: string;
};

type RosterRecord = {
	Section: Section;
	Name: string;
	StudentId: string;
	Email: string;
	Status: Status;
	"Wait Position": number;
};

type SectionRoster = {
	Section: Section;
	Roster: RosterRecord[];
};

type AttendanceRecord = {
	Timestamp: Date;
	StudentID: string;
	Name: string;
	RecordedName: string;
	Section: Section;
	SessionType: SessionType;
	WaitlistPosition: number | undefined;
};

type AbsenceInfo = {
	StudentID: string;
	Name: string;
	Email: string;
	Section: Section;
	Status: Status
	SessionType: SessionType;
	SessionDate: string;   // datetime as string
};

type UnmatchedRecord = {
	StudentID: string;
	SessionType: SessionType;
	Timestamp: Date;
};

type SessionData = {
	SessionCode: string;
	SessionType: string;
	SessionDate: string;
	Headers: {
		present: string[];
		absent: string[];
	};
	Present: AttendanceRecord[];
	Absent: AbsenceInfo[];
	Unmatched: UnmatchedRecord[];
};

type CsvRecord = {
	StudentID: string;
	Name: string;
	Email: string;
	Section: Section;
	Status: Status;
	SessionDate: string; // date as string
	SessionType: SessionType;
	Absent: "yes" | "no";
	Timestamp: Date | null;
	WaitlistPosition: number | null;
};