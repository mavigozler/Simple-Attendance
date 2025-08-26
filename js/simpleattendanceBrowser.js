import { coreProcessing } from "./simpleattendanceCore.js";
import { makeTable } from "./makeTable.js";
//import { RosterData, AttendanceData } from "./testFileContent.js";
const titleCaptionAttribs = {
    fontFamily: "Tahoma,sans-serif",
    fontWeight: "bold",
    color: "blue",
    fontSize: 11,
}, subtitleCaptionAttribs = {
    fontFamily: "Courier,Courier New",
    fontSize: 13
};
let rollTableDiv, downloadFilesButtonsDiv, rosterContent, attendanceContent, 
//	rosterFile: File | undefined,
//	attendanceFile: File | undefined,
warningsDiv = document.getElementById("warnings");
function Warning(message) {
    const spanElem = document.createElement("span");
    spanElem.appendChild(document.createTextNode(message));
    spanElem.style.display = "block";
    warningsDiv.appendChild(spanElem);
    warningsDiv.style.display = "block";
}
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("roster-file").addEventListener("change", (evt) => {
        var _a, _b;
        const rosterFile = (_b = (_a = evt.currentTarget.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : undefined;
        if (rosterFile)
            getContentFromFile(rosterFile)
                .then(content => rosterContent = content)
                .catch(err => {
                Warning(`Roster file upload error: Err=${err}`);
            });
    });
    document.getElementById("attendance-file").addEventListener("change", (evt) => {
        var _a, _b;
        const attendanceFile = (_b = (_a = evt.currentTarget.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : undefined;
        if (attendanceFile)
            getContentFromFile(attendanceFile)
                .then(content => attendanceContent = content)
                .catch(err => {
                Warning(`Roster file upload error: Err=${err}`);
            });
    });
    const processButton = document.getElementById("submit-button");
    processButton.addEventListener("click", () => {
        if (!rosterContent && !attendanceContent)
            return Error("Nothing to process: Either the roster data or attendance data or both are missing");
        const { sessionData, rosterRecords } = coreProcessing(rosterContent, attendanceContent);
        reportToHTMLPage(sessionData, rosterRecords);
        prepareCSVFiles(sessionData, downloadFilesButtonsDiv);
    });
    rollTableDiv = document.getElementById("onpage-roll");
    downloadFilesButtonsDiv = document.getElementById("download-files-buttons");
    //processButton.click();
});
function getEmail(studentId, rosterRecords) {
    var _a;
    return (_a = rosterRecords.find(rec => rec.StudentId == studentId)) === null || _a === void 0 ? void 0 : _a.Email;
}
function getContentFromFile(inputFile) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                resolve(uploadEvent.target.result);
            };
            reader.readAsText(inputFile);
        }
        catch (e) {
            reject(e);
        }
    });
}
function reportToHTMLPage(sessionsData, rosterRecords) {
    let params;
    while (rollTableDiv.firstChild)
        rollTableDiv.removeChild(rollTableDiv.firstChild);
    // generation of tables on page
    for (const sessionData of sessionsData) {
        const sessionTableDiv = document.createElement("div");
        sessionTableDiv.className = "session-table";
        rollTableDiv.appendChild(sessionTableDiv);
        if (sessionData.Absent.length > 0) {
            const absentTableDiv = document.createElement("div");
            absentTableDiv.className = "absent-table";
            sessionTableDiv.appendChild(absentTableDiv);
            params = {
                title: {
                    text: `${sessionData.SessionType} of ${sessionData.SessionDate} ` +
                        `(Code: ${sessionData.SessionCode})`,
                    attribs: titleCaptionAttribs
                },
                subtitle: {
                    text: "Absent",
                    attribs: subtitleCaptionAttribs
                },
                headers: ["Student ID", "Name", "Section", "Email"],
                data: sessionData.Absent,
                attach: rollTableDiv,
                display: [
                    (item) => { return item.StudentID; },
                    (item) => { return item.Name; },
                    (item) => { return item.Section; },
                    (item) => {
                        return {
                            attrib: "text-align:center;font:normal 10pt 'Courier New',Courier,monotype;",
                            iValue: item.Email
                        };
                    },
                    //	(item: AbsenceInfo ) => {return item.SessionType},
                    //	(item: AbsenceInfo ) => {return item.SessionDate}
                ],
                options: {}
            };
            makeTable(params); // absent table
        }
        if (sessionData.Unmatched.length > 0) {
            const unmatchedTableDiv = document.createElement("div");
            unmatchedTableDiv.className = "absent-table";
            sessionTableDiv.appendChild(unmatchedTableDiv);
            params = {
                title: {
                    text: `${sessionData.SessionType} of ${sessionData.SessionDate} ` +
                        `(Code: ${sessionData.SessionCode})`,
                    attribs: titleCaptionAttribs // check with default styling
                },
                subtitle: {
                    text: "Unmatched Records",
                    attribs: subtitleCaptionAttribs
                },
                headers: ["Student ID", "Session Type", "Timestamp"],
                data: sessionData.Unmatched,
                attach: rollTableDiv,
                display: [
                    (item) => { return item.StudentID; },
                    (item) => { return item.SessionType; },
                    (item) => { return item.Timestamp.toLocaleString(); }
                ],
                options: {}
            };
            makeTable(params); // absent table
        }
        const presentTableDiv = document.createElement("div");
        presentTableDiv.className = "present-table";
        sessionTableDiv.appendChild(presentTableDiv);
        params = {
            title: {
                text: `${sessionData.SessionType} of ${sessionData.SessionDate} ` +
                    `(Code: ${sessionData.SessionCode})`,
                attribs: titleCaptionAttribs // check with default styling
            },
            subtitle: {
                text: "Present",
                attribs: subtitleCaptionAttribs
            },
            headers: ["Student ID", "Name", "Section", "Timestamp", "Waitlist Position"],
            data: sessionData.Present,
            attach: rollTableDiv,
            display: [
                (item) => { return item.StudentID; },
                (item) => { return item.Name; },
                (item) => { return item.Section; },
                //				(item: AttendanceRecord) => { return item.SessionType },
                (item) => { return item.Timestamp.toLocaleString(); },
                (item) => { return item.WaitlistPosition ? item.WaitlistPosition.toString() : ""; },
            ],
            options: {}
        };
        makeTable(params); // present table
        const combinedData = [];
        for (const absent of sessionData.Absent)
            combinedData.push({
                StudentID: absent.StudentID,
                Name: absent.Name,
                Email: absent.Email,
                Section: absent.Section,
                //				SessionDate: absent.SessionDate,
                //				SessionType: absent.SessionType,
                "Was Absent": "yes"
            });
        for (const present of sessionData.Present)
            combinedData.push({
                StudentID: present.StudentID,
                Name: present.Name,
                Email: getEmail(present.StudentID, rosterRecords) || "not found",
                Section: present.Section,
                //				SessionDate: sessionData.SessionDate,
                //				SessionType: present.SessionType,
                "Was Absent": "no"
            });
        params = {
            title: {
                text: `${sessionData.SessionType} of ${sessionData.SessionDate} ` +
                    `(Code: ${sessionData.SessionCode})`,
                attribs: titleCaptionAttribs // check with default styling
            },
            subtitle: {
                text: `Combined List of Present and Absent`,
                attribs: subtitleCaptionAttribs // check with default styling
            },
            headers: ["Student ID", "Name", "Section", "Email", "Was Absent"],
            data: combinedData,
            attach: rollTableDiv,
            display: [
                (item) => { return item.StudentID; },
                (item) => { return item.Name; },
                (item) => { return item.Section; },
                (item) => { return item.Email; },
                (item) => { return item["Was Absent"]; },
            ],
            options: {}
        };
        makeTable(params);
    }
}
function prepareCSVFiles(sessionsData, containerElement) {
    for (const session of sessionsData) {
        // generate the CSV records
        let fileRecords = [];
        fileRecords.push(Object.keys(session.Absent));
        session.Absent.forEach(rec => Object.values(rec));
        fileRecords.push();
        // Prepare the download buttons
        const absentDownloadButton = document.createElement("button"), presentDownloadButton = document.createElement("button"), combinedDownloadButton = document.createElement("button");
        absentDownloadButton.appendChild(document.createTextNode("Download \"Absent Students\" CSV"));
        presentDownloadButton.appendChild(document.createTextNode("Download \"Present Students\" CSV"));
        combinedDownloadButton.appendChild(document.createTextNode("Download Combined Records CSV"));
        absentDownloadButton.addEventListener("click", () => {
            createFileDownload(containerElement, "#", "AbsentStudents.csv", true);
        });
        presentDownloadButton.addEventListener("click", () => {
            createFileDownload(containerElement, "#", "PresentStudents.csv", true);
        });
        combinedDownloadButton.addEventListener("click", () => {
            createFileDownload(containerElement, "#", "AllStudents.csv", true);
        });
    }
    return {};
}
function createFileDownload(containerNode, href, downloadFileName, newTab) {
    const aNode = document.createElement("a");
    aNode.setAttribute("href", href);
    aNode.setAttribute("download", downloadFileName);
    aNode.style.display = "none";
    if (newTab == true)
        aNode.target = "_blank";
    containerNode.appendChild(aNode);
    aNode.click();
    containerNode.removeChild(aNode);
}
function setupMockFiles(files) {
    // Create a mock File object
    for (const file of files) {
        const mockFile = new File(["file content"], file, { type: "text/csv" });
        // Create an input element
        const input = document.createElement("input");
        input.type = "file";
        // Assign the mock file to the input's files property
        Object.defineProperty(input, "files", {
            value: [mockFile],
            writable: false,
        });
        // Dispatch the change event
        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);
    }
}
/*setupMockFiles([
    "",
    "14 Aug Attendance.csv"
]);*/ 
//# sourceMappingURL=simpleattendanceBrowser.js.map