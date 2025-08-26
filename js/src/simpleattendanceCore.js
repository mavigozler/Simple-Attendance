export function coreProcessing(rosterRecords, sessionRecords, option) {
    const sectionRosters = [];
    let prevRecord = "";
    // Section, Name, StudentId, Email, Status
    //  Status: "Enrolled" | "Waitlisted" | "Dropped"
    let report = option && option.textReport ? option.textReport : "";
    rosterRecords.sort((a, b) => {
        return a.Section > b.Section ? 1 : a.Section < b.Section ? -1 : 0;
    });
    let list = [];
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
    const sessionsData = [], sessionBlocks = [];
    let sessionCode = "", sessionRecord, sessionBlock = [], present = [], absent = [], unmatched = [], sessionType, sessionDate;
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
        let sessionRoster = [];
        sessionCode = sessionBlock[0]["Attendance Code"];
        if (sessionCode.search(/THU/) > 0) {
            sessionType = "Thursday Lab";
            sessionRoster = sectionRosters.find(sec => sec.Section == "43958").Roster;
        }
        else if (sessionCode.search(/TUE/) > 0) {
            sessionType = "Tuesday Lab";
            sessionRoster = sectionRosters.find(sec => sec.Section == "43957").Roster;
        }
        else {
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
    return sessionsData;
}
//# sourceMappingURL=simpleattendanceCore.js.map