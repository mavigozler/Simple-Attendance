export { SessionData, Section, RosterRecord, SectionRoster, SessionRecord, 
   AttendanceRecord, AbsenceInfo, UnmatchedRecord, SessionType, Options
};

declare module "csv-parse/browser/esm/sync" {
  import { Options, Parser } from "csv-parse";
  export function parse(input: string, options?: Options): any[];
}

type SessionType = "Lecture" | "Tuesday Lab" | "Thursday Lab";

type Section = string; //= "43957" | "43958";

type SessionRecord = {
	Timestamp: Date;
	"Student ID": string;
	"Attendance Code": string;
};

type RosterRecord = {
	Section: Section;
	Name: string;
	StudentId: string;
	Email: string;
	Status: "Enrolled" | "Waitlisted" | "Dropped";
	"Wait Position": number;
};

type SectionRoster = {
	Section: Section;
	Roster: RosterRecord[];
}

type AttendanceRecord = {
	Timestamp: Date;
	StudentID: string;
	Name: string;
	Section: Section;
	SessionType: SessionType;
	WaitlistPosition: number | undefined;
};

type AbsenceInfo = {
	StudentID: string;
	Name: string;
	Email: string;
	Section: Section;
	SessionType: SessionType;
	SessionDate: string;   // datetime as string
};

type UnmatchedRecord = {
	StudentID: string;
	SessionType: SessionType;
	Timestamp: Date;
}

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
