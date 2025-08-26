(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
document.addEventListener("DOMContentLoaded", () => {
    const rosterFile = document.getElementById("roster-file"), attendanceFile = document.getElementById("attendance-file"), rollTableDiv = document.getElementById("onpage-roll"), downloadFilesButtonsDiv = document.getElementById("download-files-buttons");
    let report = "";
    const rosterRecords = parse(getContentFromFile(rosterFile), {
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
    const sessionRecords = parse(getContentFromFile(attendanceFile), {
        columns: true,
        skip_empty_lines: true
    });
    const sessionsData = coreProcessing(rosterRecords, sessionRecords);
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
});
function getContentFromFile(fileUploadElem) {
    let result;
    try {
        fileUploadElem.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            result = yield ((_a = fileUploadElem.files) === null || _a === void 0 ? void 0 : _a[0].text());
            /*
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                result = uploadEvent.target!.result as string;
            };
            reader.readAsText((evt.target as HTMLInputElement).files![0])
            */
        }));
    }
    catch (err) {
    }
    if (!result)
        console.log("");
    return result;
}

},{}]},{},[1]);
