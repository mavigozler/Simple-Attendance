var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { parse } from "../node_modules/csv-parse/dist/esm/sync.js";
import { coreProcessing } from "./simpleattendanceCore.js";
import { makeTable } from "./makeTable.js";
import { RosterData, AttendanceData } from "../public/testFileContent";
let rollTableDiv, downloadFilesButtonsDiv, rosterFile, attendanceFile;
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("roster-file").addEventListener("change", (evt) => {
        var _a, _b;
        rosterFile = (_b = (_a = evt.currentTarget.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : undefined;
    });
    document.getElementById("attendance-file").addEventListener("change", (evt) => {
        var _a, _b;
        attendanceFile = (_b = (_a = evt.currentTarget.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : undefined;
    });
    document.getElementById("submit-button").addEventListener("click", () => {
        let rosterContent, attendanceContent;
        if (RosterData && AttendanceData) {
            rosterContent = RosterData;
            attendanceContent = AttendanceData;
        }
        else {
            if (!rosterFile || !attendanceFile)
                return Error("Nothing to process: Either the roster data or attendance data or both are missing");
            rosterContent = getContentFromFile(rosterFile);
            attendanceContent = getContentFromFile(attendanceFile);
        }
        if (!rosterContent) {
            Error("roster content");
            return {};
        }
        if (!attendanceContent) {
            Error("attendandce content");
            return {};
        }
        prepareCSVFiles(process(rosterContent, attendanceContent), downloadFilesButtonsDiv);
    });
    rollTableDiv = document.getElementById("onpage-roll");
    downloadFilesButtonsDiv = document.getElementById("download-files-buttons");
});
function process(rosterContent, attendanceContent) {
    let report = "";
    const rosterRecords = parse(rosterContent, {
        columns: (header) => {
            report += `${header},`;
            return header.map((h) => h.trim());
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
    // Timestamp, Student ID, Attendance Code
    const sessionRecords = parse(attendanceContent, {
        columns: true,
        skip_empty_lines: true
    });
    const sessionsData = coreProcessing(rosterRecords, sessionRecords);
    // generation of tables on page
    for (const sessionData of sessionsData) {
        const sessionTableDiv = document.createElement("div");
        sessionTableDiv.className = "session-table";
        rollTableDiv.appendChild(sessionTableDiv);
        if (sessionData.Absent.length > 0) {
            const absentTableDiv = document.createElement("div");
            absentTableDiv.className = "absent-table";
            sessionTableDiv.appendChild(absentTableDiv);
            const params = {
                title: {
                    text: `${sessionData.SessionType} of ${sessionData.SessionDate} ` +
                        `(Code: ${sessionData.SessionCode})`,
                    attribs: undefined // check with default styling
                },
                subtitle: {
                    text: "",
                    attribs: undefined
                },
                headers: Object.keys(sessionData.Absent),
                data: sessionData.Absent,
                attach: {},
                display: {},
                options: {}
            };
            const absentDataTable = makeTable(params);
        }
        const presentTableDiv = document.createElement("div");
        presentTableDiv.className = "present-table";
        sessionTableDiv.appendChild(presentTableDiv);
        const params = {
            title: {
                text: "",
                attribs: null
            },
            headers: Object.keys(sessionData.Present),
            data: sessionData.Present,
            attach: {},
            display: {},
            options: {}
        };
        const presentDataTable = makeTable(params);
    }
    // generate CSVs for absent and present
    return sessionsData;
}
function getContentFromFile(inputFile) {
    let result;
    try {
        () => __awaiter(this, void 0, void 0, function* () {
            result = yield (inputFile.text());
            /*
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                result = uploadEvent.target!.result as string;
            };
            reader.readAsText((evt.target as HTMLInputElement).files![0])
            */
        });
    }
    catch (err) {
    }
    if (result)
        return result;
    console.error("Testing");
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