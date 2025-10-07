import type { SessionData, RosterRecord, Section, 
	AbsenceInfo, AttendanceRecord, UnmatchedRecord} from "./types/simpleattendanceTypes";

// import { generate } from "../node_modules/csv-generate/dist/esm/sync.js";
import { coreProcessing, setPacificTime } from "./simpleattendanceCore.js";
import { makeTable } from "./makeTable.js";

//import { RosterData, AttendanceData } from "./testFileContent.js";
const titleCaptionAttribs: ElementCssProperties = {
		fontFamily: "Tahoma,sans-serif",
		fontWeight: "bold",
		color: "blue",
		fontSize: 13,
},
subtitleCaptionAttribs: ElementCssProperties = {
	fontFamily: "Courier,Courier New",
	fontSize: 16
};

let rollTableDiv: HTMLDivElement,
	downloadFilesButtonsDiv: HTMLDivElement,
	rosterContent: string,
	warningsDiv = document.getElementById("warnings") as HTMLDivElement;

/**
 * @function Warning
 * @param message 
 */
function Warning(message: string) {
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
	/* build HTML form */
	const droppedFiles: File[] = [];
   const rosterFileControl = document.getElementById("roster-file") as HTMLInputElement;
	rosterFileControl.addEventListener("change", (evt: Event) => {
		const rosterFile = (evt.currentTarget as HTMLInputElement).files?.[0] ?? undefined;
		if (rosterFile)
			getContentsFromFiles([rosterFile])
			.then(content => rosterContent = content[0])  // get the one file
			.catch(err => {
				Warning(`Roster file upload error: Err=${err}`);
			});
	});
/*************************************************************************
 *   Attendance Records Input UI start
 *************************************************************************/
	let attendanceCsvFiles: File[];
	const attendanceFileFormat = "AttendanceDDDDDDDD.csv";
	const spanElem = document.createElement("span");
	spanElem.id = "attendance-file-format-string";
	spanElem.appendChild(document.createTextNode(attendanceFileFormat));
	document.getElementById("attendance-file-format")?.appendChild(spanElem);
	
	const dropzone = document.getElementById('dropzone') as HTMLInputElement;
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
					(entry as FileSystemDirectoryEntry).createReader().readEntries(entries => {
						entries.forEach((droppedEntry: FileSystemEntry) => {
							if (droppedEntry.isFile) {
								const fileEntry = droppedEntry as FileSystemFileEntry;
								fileEntry.file(
									(theFile: File) => {
										droppedFiles.push(theFile);
									}, 
									(err) => {
										// error callback
										Warning(`${entry.name} folder fetch had following issue: ${err}`);
									}
								);
							} else
								Warning("Entry is not a file");
						});
						attendanceCsvFiles = getCsvFilesOnly(droppedFiles);
					}, 
					(err) => {
						// error callback
						Warning(`${entry.name} folder fetch had following issue: ${err}`);
					});
				}
			}
		}
  	});
   document.getElementById("attendance-files-folder")!.addEventListener("change", (evt: Event) => {
		let fileItem: File | null;
		const attendanceFileList = (evt.currentTarget as HTMLInputElement).files ?? undefined;
		// filter to files of *.csv type
		if (attendanceFileList)
			for (let i = 0; fileItem = attendanceFileList.item(i++); fileItem != null)
				droppedFiles.push(fileItem);
			attendanceCsvFiles = getCsvFilesOnly(droppedFiles);
	});
   const processButton: HTMLButtonElement = document.getElementById("submit-button")! as HTMLButtonElement;
	processButton.addEventListener("click", async () => {
		if (!rosterContent && attendanceCsvFiles)
			return Error("Nothing to process: Either the roster data or attendance data or both are missing");
		const trimmedList = attendanceCsvFiles.filter(item => {
			return item.name.search(/Attendance\D{8}\.csv/i) >= 0;
		});
		const attendanceFilesContents = await getContentsFromFiles(trimmedList);
		const {sessionsData, rosterRecords } = coreProcessing(rosterContent, attendanceFilesContents);
		reportToHTMLPage(sessionsData, rosterRecords );
		prepareCSVFiles(sessionsData, downloadFilesButtonsDiv);
	});
	rollTableDiv = document.getElementById("onpage-roll") as HTMLDivElement;
	downloadFilesButtonsDiv = document.getElementById("download-files-buttons") as HTMLDivElement;
	//processButton.click();
});

function getCsvFilesOnly(fileList: File[]): File[] {
	const trimList: File[] = [];
	const selectList = document.getElementById("select-list") as HTMLDivElement;
	for (const file of fileList)
		if (file.name.search(/^Attendance\d{8}\.csv$/i) >= 0) {
			trimList.push(file);
			selectList.appendChild(document.createTextNode(file.name));
			selectList.appendChild(document.createElement("br"));
		}
	return trimList;
}

function getEmail(studentId: string, rosterRecords: RosterRecord[]) {
	return rosterRecords.find(rec => rec.StudentId == studentId)?.Email;
}

/**
 * @function getContentsFromFiles
 * @param inputFiles
 * @returns 
 */
function getContentsFromFiles(inputFiles: File[]): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => {
		const fileRequests: Promise<string>[] = [];
		for (const inputFile of inputFiles)
			fileRequests.push(new Promise<string>((resolve, reject) => {
				try {
					const reader = new FileReader();
					reader.onload = (uploadEvent) => {
						resolve(uploadEvent.target!.result as string);
					};
					reader.readAsText(inputFile);
				} catch (e) {
					reject(e);
				}
			}));
		Promise.all(fileRequests).then((inputFilesContents: string[]) => {
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
function reportToHTMLPage(sessionsData: SessionData[], rosterRecords: RosterRecord[]) {
	let params: TMakeTableParams;

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
				headers: [ "Student ID", "Name", "Section", "Status", "Email"  ],
				data: sessionData.Absent,
				attach: rollTableDiv,
				display: [
					(item: AbsenceInfo ) => {return item.StudentID},
					(item: AbsenceInfo ) => {return item.Name},
					(item: AbsenceInfo ) => {return item.Section},
					(item: AbsenceInfo ) => {return item.Status},
					(item: AbsenceInfo ) => {return {
							attrib: "text-align:center;font:normal 10pt 'Courier New',Courier,monotype;",
							iValue: item.Email,
							wrapLink: `mailto:${item.Email}`
						}},
				//	(item: AbsenceInfo ) => {return item.SessionType},
				//	(item: AbsenceInfo ) => {return item.SessionDate}
				],
				options: {
					
				} as TMakeTableOptions
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
				headers: [ "Student ID", "Session Type", "Timestamp"  ],
				data: sessionData.Unmatched,
				attach: rollTableDiv,
				display: [
					(item: UnmatchedRecord ) => {return item.StudentID},
					(item: UnmatchedRecord ) => {return item.SessionType},
					(item: UnmatchedRecord ) => {return setPacificTime(item.Timestamp)}
				],
				options: {
					
				} as TMakeTableOptions
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
				(item: AttendanceRecord) => { return item.StudentID },
				(item: AttendanceRecord) => { return item.Name },
				(item: AttendanceRecord) => { return item.Section },
//				(item: AttendanceRecord) => { return item.SessionType },
				(item: AttendanceRecord) => { return setPacificTime(item.Timestamp) },
				(item: AttendanceRecord) => { return item.WaitlistPosition ? item.WaitlistPosition.toString() : "" },
			],
			options: {
			
			} as TMakeTableOptions
		}
		makeTable(params); // present table

		const combinedData: {
			StudentID: string;
			Name: string;
			Email: string;
			Section: Section;
//			SessionDate: string;
//			SessionType: SessionType;
			"Was Absent": "yes" | "no";
		}[] = [];
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
			headers: ["Student ID", "Name", "Section", "Email", "Was Absent"	],
			data: combinedData,
			attach: rollTableDiv,
			display: [
				(item: AttendanceRecord) => { return item.StudentID },
				(item: AttendanceRecord) => { return item.Name },
				(item: AttendanceRecord) => { return item.Section },
				(item) => { return item.Email },
				(item) => { return item["Was Absent"] },
			],
			options: {
			
			} as TMakeTableOptions
		}
		makeTable(params);
	}
}

/**
 * @function prepareCSVFiles
 * @param sessionsData 
 * @param containerElement 
 * @returns 
 */
function prepareCSVFiles(sessionsData: SessionData[], containerElement: HTMLElement): {absent: string; present: string; combined: string} {
	for (const session of sessionsData) {
	// generate the CSV records
		let fileRecords: string[][] = [];
			fileRecords.push(Object.keys(session.Absent));
			session.Absent.forEach(rec => Object.values(rec));
			fileRecords.push();
	// Prepare the download buttons
		const absentDownloadButton = document.createElement("button"),
				presentDownloadButton = document.createElement("button"),
				combinedDownloadButton = document.createElement("button");
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
	return {} as {absent: string; present: string; combined: string};
}

/**
 * @function createFileDownload
 * @param containerNode 
 * @param href 
 * @param downloadFileName 
 * @param newTab
 */
function createFileDownload(
	containerNode: HTMLElement,
	href: string,
	downloadFileName: string,
	newTab?: boolean
): void {
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