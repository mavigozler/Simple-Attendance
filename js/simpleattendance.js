import { readFile, writeFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import columnify from "columnify";
const rosterFilename = "D:\\Mavigozler GitHub\\mavigozler.github.io\\Teaching\\Chemistry\\Chem 3A Attendance\\Section Rosters.csv", attendanceRecordsFilename = "D:\\Mavigozler GitHub\\mavigozler.github.io\\Teaching\\Chemistry\\Chem 3A Attendance\\14 Aug Attendance.csv";
async function processData() {
    let report = "";
    try {
        const roster = await readFile(rosterFilename, 'utf8');
        const attendance = await readFile(attendanceRecordsFilename, 'utf8');
        // Section, Name, StudentId, Email, Status
        //  Status: "Enrolled" | "Waitlisted" | "Dropped"
        report += "Roster.csv raw headers:\n";
        const rosterRecords = parse(roster, {
            columns: (header) => {
                report += `${header},`;
                return header.map(h => h.trim());
            },
            skip_empty_lines: true,
            cast: (value, context) => {
                if (context.column == "StudentId")
                    return value.length == 6 ? "0" + value : value;
                else if (context.column == "Wait Position")
                    return parseInt(value);
                return value;
            }
        });
        report += "\n\n";
        // Timestamp, Student ID, Attendance Code
        const sessionRecords = parse(attendance, {
            columns: true,
            skip_empty_lines: true
        });
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
        const sessionsData = [], sessionBlocks = [];
        let sessionCode = "", sessionRecord, rosterRecord, sessionBlock = [], present = [], absent = [], unmatched = [], sessionType, sessionDate;
        sessionRecords.sort((a, b) => {
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
            sessionCode = sessionBlock[0]["Attendance Code"];
            sessionType = sessionCode.search(/THU/) > 0 ? "Thursday Lab" :
                sessionCode.search(/TUE/) > 0 ? "Tuesday Lab" : "Lecture";
            sessionDate = new Date(sessionBlock[0].Timestamp).toLocaleDateString();
            // search session records for enrolled students first
            for (const rosterRecord of rosterRecords)
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
                }
                else if (rosterRecord.Status == "Enrolled")
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
                if (rosterRecords.find(rosRec => rosRec.StudentId == sessionRecord["Student ID"] &&
                    rosRec.Status == "Enrolled"))
                    continue;
                else
                    unmatched.push({
                        StudentID: sessionRecord["Student ID"].toString(),
                        SessionType: sessionType,
                        Timestamp: sessionRecord.Timestamp
                    });
            sessionsData.push({
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
        for (const sessionData of sessionsData) {
            report +=
                "========================" +
                    `\nSession Code: ${sessionData.SessionCode}` +
                    `\nSession Date: ${sessionData.SessionDate}` +
                    `\nSession Type: ${sessionData.SessionType}` +
                    "\n----" +
                    "\nABSENT\n" +
                    columnify(sessionData.Absent) +
                    "\nPRESENT\n" +
                    columnify(sessionData.Present) + "\n\n";
        }
        try {
            await writeFile("../test/Attendance Report.txt", report);
        }
        catch (exc) {
            console.error('An exception occurred:', exc);
        }
    }
    catch (exc) {
        console.error('An exception occurred:', exc);
    }
}
processData();
//# sourceMappingURL=simpleattendance.js.map