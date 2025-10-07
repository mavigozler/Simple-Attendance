import { readFile, writeFile, readdir } from "fs/promises";
import columnify from "columnify";
//import { parse } from "csv-parse/browser/esm/sync";
import { spawn } from 'child_process';
import path from 'path';

import { coreProcessing } from "./simpleattendanceCore.js";
// import type { SessionData } from "./types/simpleattendanceTypes.d.ts";

async function fileDialog(openFileDialogPS1Path: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let resultPath: string = "";
		const child = spawn("powershell.exe", [
			'-NoProfile',
			'-NonInteractive',
			'-ExecutionPolicy', 'Bypass',
			'-File', openFileDialogPS1Path,
			'-FileWantedType', 'CSV',
			'-FileTypeFilter', 'CSV files (*.csv)|*.csv|All files (*.*)|*.*'
		],
		{
  			env: { ...process.env, WAIT_FOR_DEBUGGER: "1" }
		});
		child.stdout.on('data', (data) => {
			resultPath += data.toString().trim();
		});
		child.stderr.on('data', (data: unknown) => {
			console.error(`PowerShell Error: ${data}`);
		});
		child.on('close', (code: unknown) => {
			console.log(`PowerShell script exited with code ${code}`);

			if (code === 0 && resultPath) {
				// A file was selected and the path was successfully returned
				console.log(`Selected file path: ${resultPath}`);
				resolve(resultPath);
				// You can now use the filePath variable in your Node.js application
			} else {
				// The user either cancelled the dialog or an error occurred
				reject('No file was selected or an error occurred.');
			}
		});
	})
}

async function directoryDialog(openDirDialogPS1Path: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let resultPath: string = "";
		const child = spawn("powershell.exe", [
			'-NoProfile',
			'-NonInteractive',
			'-ExecutionPolicy', 'Bypass',
			'-File', openDirDialogPS1Path,
			'-Description', 'Select folder containing target CSV files',
			'-SelectedPath', 'D:\\Mavigozler GitHub\\mavigozler.github.io\\Teaching\\Chemistry\\Chem 3A Attendance',
			'-ShowNewFolderButton', 'false'
		]/*,
		{
  			env: { ...process.env, WAIT_FOR_DEBUGGER: "1" }
		}*/);
		child.stdout.on('data', (data: any) => {
			resultPath += data.toString().trim();
		});
		child.stderr.on('data', (data: unknown) => {
			console.error(`PowerShell Error: ${data}`);
		});
		child.on('exit', (code: unknown) => {
			console.log(`PowerShell script exited with code ${code}`);

			if (code === 0 && resultPath) {
				// A file was selected and the path was successfully returned
				console.log(`Selected file path: ${resultPath}`);
				resolve(resultPath);
				// You can now use the filePath variable in your Node.js application
			} else {
				// The user either cancelled the dialog or an error occurred
				reject('No file was selected or an error occurred.');
			}
		});
	})
}

async function collectAttendanceRecords(): Promise<string[]> {
	const recordsFolder = await directoryDialog("D:\\Documents\\PowerShell\\openFolderDialog.ps1");
			// "D:\\Mavigozler GitHub\\mavigozler.github.io\\Teaching\\Chemistry\\Chem 3A Attendance";
	const folderFiles = (await readdir(recordsFolder)).filter(item => item.search(/^Attendance\d{8}.csv$/i) == 0);
	const openedFiles: Promise<string>[] = [];
	for (const file of folderFiles)
		if (file.search(/^Attendance\d{8}\.csv$/) >= 0)
			openedFiles.push(new Promise<string>((resolve, reject) => {
				(async () => {
					try {
						resolve(await readFile(path.join(recordsFolder, file), { encoding: "utf8"}));
					} catch (except) {
						reject(`Error: ${except}`);
					}
				})();
			}));
	return Promise.all(openedFiles)
	.then((records: string[]) => {
		return records;
	}).catch(err => { return err });
}

(async() => {
	const today: Date = new Date();
	const rosterFilename = await fileDialog("D:\\Documents\\PowerShell\\openFileDialog.ps1");
			//"D:\\Mavigozler GitHub\\mavigozler.github.io\\Teaching\\Chemistry\\Chem 3A Attendance\\Section Rosters Week 3.csv";
	const attendanceRecords = await collectAttendanceRecords();
	const rosterContent = await readFile(rosterFilename, 'utf8');
	const {sessionsData, rosterRecords, csvData } = coreProcessing(rosterContent, attendanceRecords);

	let report = "ATTENDANCE REPORT for Chemistry 3A" +
		"\nGenerated:  " + today.toLocaleDateString();
	for (const sessionData of sessionsData) {
		report += "\n\n========================" +
			`\nSession Code: ${sessionData.SessionCode}` +
			`\nSession Date: ${sessionData.SessionDate}` +
			`\nSession Type: ${sessionData.SessionType}` +
			"\n----" +
			"\n\n------ ABSENT\n" +
			(sessionData.Absent.length == 0 ? "--NONE--" : columnify(sessionData.Absent)) +
			"\n\n------ PRESENT\n" +
			columnify(sessionData.Present) + "\n\n" ;
	} 
	let fileNum: number = 1;
	const setFileDating = (num: number) => {
		return `${today.getFullYear()}-${(today.getMonth() + 1).toString()}-` +
			`${today.getDate().toString().padStart(2, "0")} #${num.toString().padStart(2, '0')}`;
	};
	const maxRetries = 3;
   let currentRetry = 0,
		success = false;
	while (!success && currentRetry < maxRetries)
		try {
			await writeFile(
				`../test/Attendance Report-${setFileDating(fileNum)}.txt`, 
				report, 
				{flag: "wx"} 
			);
			success = true;
			//	resolve(csvData);
		} catch (exc) {
			currentRetry++;
			//	reject(`An exception occurred: ${exc}`);	
		}
//	await fileDialog("D:\\Documents\\PowerShell\\saveFileDialog.ps1");
})();


/*
function processData(rosterFilename: string, attendanceRecordsFilename: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let report = "";
		(async() => {
			try {
				const rosterContent = await readFile(rosterFilename, 'utf8');
				const attendanceContent = await readFile(attendanceRecordsFilename, 'utf8');
					report += "Roster.csv raw headers:\n";

				// Timestamp, Student ID, Attendance Code
				const {sessionData, rosterRecords, csvData } = coreProcessing(rosterContent, attendanceContent);
		/*
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
					resolve(csvData);
				} catch (exc) {
					reject(`An exception occurred: ${exc}`);	
				}
			} catch (exc) {
				reject(`An exception occurred: ${exc}`);	
			}
		})();
	});
}
*/