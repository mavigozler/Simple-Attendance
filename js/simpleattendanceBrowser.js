var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// import { generate } from "../node_modules/csv-generate/dist/esm/sync.js";
import { coreProcessing, setPacificTime } from "./simpleattendanceCore.js";
import { makeTable } from "./makeTable.js";
//import { RosterData, AttendanceData } from "./testFileContent.js";
const titleCaptionAttribs = {
    fontFamily: "Tahoma,sans-serif",
    fontWeight: "bold",
    color: "blue",
    fontSize: 13,
}, subtitleCaptionAttribs = {
    fontFamily: "Courier,Courier New",
    fontSize: 16
};
let rollTableDiv, downloadFilesButtonsDiv, rosterContent, warningsDiv = document.getElementById("warnings"), SelectList;
/**
 * @function Warning
 * @param message
 */
function Warning(message) {
    const spanElem = document.createElement("span");
    spanElem.appendChild(document.createTextNode(message));
    spanElem.style.display = "block";
    warningsDiv.appendChild(spanElem);
    warningsDiv.style.display = "block";
}
/**
 *
 */
document.addEventListener("DOMContentLoaded", () => {
    var _a, _b, _c;
    /* build HTML form */
    SelectList = document.getElementById("select-list");
    (_a = document.getElementById("form-reset")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (evt) => {
        evt.currentTarget.form.reset();
        while (SelectList.firstChild)
            SelectList.removeChild(SelectList.firstChild);
    });
    const droppedFiles = [];
    const rosterFileControl = document.getElementById("roster-file");
    rosterFileControl.addEventListener("change", (evt) => {
        var _a, _b;
        const rosterFile = (_b = (_a = evt.currentTarget.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : undefined;
        if (rosterFile)
            getContentsFromFiles([rosterFile])
                .then(content => rosterContent = content[0]) // get the one file
                .catch(err => {
                Warning(`Roster file upload error: Err=${err}`);
            });
    });
    /*************************************************************************
     *   Attendance Records Input UI start
     *************************************************************************/
    let attendanceCsvFiles;
    const attendanceFileFormat = "AttendanceDDDDDDDD.csv";
    const spanElem = document.createElement("span");
    spanElem.id = "attendance-file-format-string";
    spanElem.appendChild(document.createTextNode(attendanceFileFormat));
    (_b = document.getElementById("attendance-file-format")) === null || _b === void 0 ? void 0 : _b.appendChild(spanElem);
    // DROPPED FILES code
    const dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', e => {
        e.preventDefault(); // allow drop
    });
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        if (e.dataTransfer) {
            const items = e.dataTransfer.items;
            for (let i = 0; i < items.length; i++) {
                const entry = items[i].webkitGetAsEntry();
                if (entry && entry.isDirectory) {
                    //(entry as FileSystemDirectoryEntry)
                    entry.createReader().readEntries(entries => {
                        const dirEntriesRequest = [];
                        for (const entry of entries)
                            dirEntriesRequest.push(new Promise((resolve, reject) => {
                                if (entry.isFile) {
                                    const fileEntry = entry;
                                    fileEntry.file((theFile) => {
                                        resolve(theFile);
                                    }, (err) => {
                                        // error callback
                                        reject(Warning(`${entry.name} folder fetch had following issue: ${err}`));
                                    });
                                }
                            }));
                        Promise.all(dirEntriesRequest).then((theFiles) => {
                            attendanceCsvFiles = getCsvFilesOnly(theFiles);
                            document.getElementById("attendance-files-folder-input").style.display = "none";
                        }).catch(err => {
                            Warning(`${entry.name} folder fetch had following issue: ${err}`);
                        });
                    }, (err) => {
                        // error callback
                        Warning(`${entry.name} folder fetch had following issue: ${err}`);
                    });
                }
            }
        }
    });
    // CHOOSE FILES input code
    document.getElementById("attendance-files-folder-input").addEventListener("change", (evt) => {
        var _a;
        let fileItem;
        const attendanceFileList = (_a = evt.currentTarget.files) !== null && _a !== void 0 ? _a : undefined;
        // filter to files of *.csv type
        if (attendanceFileList)
            for (let i = 0; fileItem = attendanceFileList.item(i++); fileItem != null)
                droppedFiles.push(fileItem);
        if (droppedFiles.length == 0) {
            document.getElementById("attendance-files-prompt").style.display = "none";
            document.getElementById("select-list-report").appendChild(document.createTextNode("No files were found in the list of files selected. Reset and try again"));
        }
        else
            attendanceCsvFiles = getCsvFilesOnly(droppedFiles);
    });
    (_c = document.getElementById("control-time")) === null || _c === void 0 ? void 0 : _c.addEventListener("change", (evt) => {
        if (evt.currentTarget.checked == true)
            timeControlDiv.style.display = "";
    });
    const timeControlDiv = document.getElementById("right-side"), daynameproducer = new Date('2023-01-01T00:00:00'); // starts on Sunday
    timeControlDiv.appendChild(document.createTextNode("Use this optional feature to make sure students record attendance within a proper time window"));
    const weekdaysLabelElem = document.createElement("label");
    weekdaysLabelElem.id = "weekdaysLabelElem";
    timeControlDiv.appendChild(weekdaysLabelElem);
    const beforeText = document.createElement("span");
    weekdaysLabelElem.appendChild(beforeText);
    beforeText.appendChild(document.createTextNode("Select the days of the week for which attendance records are wanted"));
    beforeText.id = "beforeText";
    for (let i = 0; i < 7; i++) {
        const daySpanElem = document.createElement("span");
        timeControlDiv.appendChild(daySpanElem);
        daySpanElem.className = "daySpanElem";
        // for 1st day of week = Monday daynameproducer.setDate(date.getDate() + 1)
        const namedDay = document.createElement("span");
        namedDay.appendChild(document.createTextNode(daynameproducer.toLocaleDateString("en-US", { weekday: "long" }) + ": "));
        daySpanElem.appendChild(namedDay);
        daynameproducer.setDate(daynameproducer.getDate() + 1);
        const textboxForHours = document.createElement("input");
        daySpanElem.appendChild(textboxForHours);
        textboxForHours.className = "textboxForHours";
        weekdaysLabelElem.appendChild(daySpanElem);
    }
    const timePeriodsDivElem = document.createElement("div");
    timeControlDiv.appendChild(timePeriodsDivElem);
    timePeriodsDivElem.appendChild(document.createTextNode("Set one or more time periods within the attendance days in which code submissions " +
        "will not be flagged. Codes sumbitted outside the time period(s) will be flagged " +
        "for notice."));
    timePeriodsDivElem.appendChild(document.createElement("br"));
    timePeriodsDivElem.appendChild(document.createTextNode("Text entry formats must be 'HH:MM [am|pm]' and start and stop times must be indicated. " +
        "Entries will be validated"));
    const processButton = document.getElementById("submit-button");
    processButton.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
        if (!rosterContent && attendanceCsvFiles)
            return Error("Nothing to process: Either the roster data or attendance data or both are missing");
        const trimmedList = attendanceCsvFiles.filter(item => {
            return item.name.search(/Attendance\d{8}\.csv/i) >= 0 ? item : undefined;
        });
        const attendanceFilesContents = yield getContentsFromFiles(trimmedList);
        const { sessionsData, rosterRecords } = coreProcessing(rosterContent, attendanceFilesContents);
        prepareCSVFiles(sessionsData, downloadFilesButtonsDiv);
        reportToHTMLPage(sessionsData, rosterRecords);
    }));
    rollTableDiv = document.getElementById("onpage-roll");
    downloadFilesButtonsDiv = document.getElementById("download-files-buttons");
    //processButton.click();
});
function createTimePeriodControls(container) {
}
function getCsvFilesOnly(fileList) {
    const trimList = [];
    for (const file of fileList)
        if (file.name.search(/^Attendance\d{8}\.csv$/i) >= 0) {
            trimList.push(file);
            SelectList.appendChild(document.createTextNode(file.name));
            SelectList.appendChild(document.createElement("br"));
        }
    return trimList;
}
function getEmail(studentId, rosterRecords) {
    var _a;
    return (_a = rosterRecords.find(rec => rec.StudentId == studentId)) === null || _a === void 0 ? void 0 : _a.Email;
}
/**
 * @function getContentsFromFiles
 * @param inputFiles
 * @returns
 */
function getContentsFromFiles(inputFiles) {
    return new Promise((resolve, reject) => {
        const fileRequests = [];
        for (const inputFile of inputFiles)
            fileRequests.push(new Promise((resolve, reject) => {
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
            }));
        Promise.all(fileRequests).then((inputFilesContents) => {
            resolve(inputFilesContents);
        }).catch(err => {
            reject(err);
        });
    });
}
/**
 * @function reportToHTMLPage
 * @param sessionsData
 * @param rosterRecords
 */
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
                headers: ["Student ID", "Name", "Section", "Status", "Email"],
                data: sessionData.Absent,
                attach: rollTableDiv,
                display: [
                    (item) => { return item.StudentID; },
                    (item) => { return item.Name; },
                    (item) => { return item.Section; },
                    (item) => { return item.Status; },
                    (item) => {
                        return {
                            attrib: "text-align:center;font:normal 10pt 'Courier New',Courier,monotype;",
                            iValue: item.Email,
                            wrapLink: `mailto:${item.Email}`
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
                    (item) => { return setPacificTime(item.Timestamp); }
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
                (item) => { return setPacificTime(item.Timestamp); },
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
/**
 * @function prepareCSVFiles
 * @param sessionsData
 * @param containerElement
 * @returns
 */
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
/**
 * @function createFileDownload
 * @param containerNode
 * @param href
 * @param downloadFileName
 * @param newTab
 */
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
/*
function setupMockFiles(files: string[]) {
    // Create a mock File object
    for (const file of files) {
        const mockFile = new File(
            ["file content"],
            file,
            { type: "text/csv" }
        );

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

setupMockFiles([
    "",
    "14 Aug Attendance.csv"
]);*/ 
//# sourceMappingURL=simpleattendanceBrowser.js.map