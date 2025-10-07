"use strict";
import { iCss } from "./iCss.js";
export { makeTable };
/*****************************************************

makeTable() will compose an HTML table with a very few properties defined
in its single parameter (instead of using multiple arguments, that affect order)

The parameter type of makeTable() is specified as follows

    type TMakeTableParams = {
        title: {
            text: string;
            attribs: CssCaptionProperties | null | undefined;
        };
        subtitle?: {
           text: string;
           attribs: CssCaptionProperties | null | undefined;
        }
        headers: any[] /*string[] | {  // can be array of string or two property
            title: string;
            style: string;
        }[];
        data: any[];
        attach: HTMLDivElement;  // the existing element in body which
                    // the table elmenet will be appended
        display: TMakeTableDisplayParam;  // how the data is presented in cells
        options: {
            columns: number; // specifies columns to use, but the counts of
                     // elements in headers[] must be zero or one
                     // use this option for example when there are to be multiple
                     // columns of nothing but names in a multi-column list of names
            columnWidths: [ string, string, ...] // must be standard width measures
            cellStyles: [] // other than using external CSS through 'id','class' attributes
            addRowCounting?: {  // this adds a leftmost column with numbers to show rows
                by: number;
            } | null;
            onNull?: string;
            emptyTable?: boolean; // use to generate a table without anything in it.
            styling?: {
                table?: CssTableProperties | null | undefined;
                     col?: CssTableProperties[] | null | undefined;
            }
        } | null;
    };

The column headers are an array of strings indicating name/title of data

The display parameter shows the data transformation that occurs, in column order
each element is a function for the form '() => {return X} where X can be any type
(string, object, etc)

    if there is a 'return "$$__"; block, then the setCellValue() is called

      () => { return }

    The argument (arg) is optional, but if supplied, it can be an object
   to supply more than one parameter wrapped in the argument.

    A type can be supplied to the argument which is defined below:

            type TTableDefinitionItem = {
               tag: string;
               originalUrl: string;
               created: Date;
               modified: Date;
               type: number;
               href: string;
               [key: string]: any;
            };

see the example below.

The data supplied should be an array of objects with the defintions

The 'attach' point is the node id of the element to which the data willl be inserted

options are described as follows:

    makeTable({
      title: "Replicate File Names in " + libName,
      subtitle: "(Site: " + siteName + ")",
      headers: ["ID", "File Name", "Parent Path", "Size", "Created", "Modified"],
      display: [
        () => { return "$$id"; },
         (item: TTableDefinitionItem) => {
            return {
                attrib: "class=" + item.tag,
               iValue: "$$name",
               wrapLink: item.originalUrl
            };
         },
         (item: TTableDefinitionItem) => {
            return {
                attrib: "",
               iValue: "$$parentPath",
               wrapLink: item.originalUrl.substring(0, item.originalUrl.lastIndexOf("/"))
            };
         },
         () => { return "$$size"; },
         (item: TTableDefinitionItem) => { return new Date(item.created).toLocaleDateString(); },
         (item: TTableDefinitionItem) => { return new Date(item.modified).toLocaleDateString(); },
      ],
      data: dupFiles,
      attach: insertionPoint,
        options: {
            styling: {
                table: "width: auto",
                col: [ "width:50%", "width:30%", "width:20%"]
            }
        }
   });


/**
* @function makeTable
* @param params -- the following properties are set
*      .headers: string[]  the text to be used in column headers
*      .display:
* 				((arg?: any) => string | {attrib: string; iValue: string}) []
*              a function to execute to render what is displayed in table cell
*              can be either a string or object of type {attrib: string; value: string;}
*           attrib can be td attribs with format "id='<idval>';;class='<classval>';;..."
*             use split(";;") to disjoin, then use split("=") to get name=value pairs
*      .data: any[]  the data items as array to be supplied and executed
*      .attach: the form node to attach the table to
*      .options: string[]
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function makeTable(params) {
    const totalColumns = params.headers.length, myICss = new iCss(), colWidths = [], testWidthElement = document.createElement("span"), defaultCaptionTitleStyling = {
        color: "lime",
        backgroundColor: "navy",
        //	captionSide: "top",
        fontSize: "125%",
        fontWeight: "bold",
        padding: "0 0 0 2em"
    }, defaultCaptionSubtitleStyling = {
        fontSize: "83%",
        color: "yellow",
        fontWeight: "normal"
    };
    let i, trElem, tdNode, captionElem, pNode, 
    //   colgrpElem: HTMLTableColElement,
    colElem, colStyle, 
    //    style: any,
    value, // string | {iValue?: any; wrapLink: any} | {},
    headerTitle, 
    //		matches: RegExpMatchArray | null,
    tableOptions = null, rowCounter = 0;
    document.body.appendChild(testWidthElement);
    if (params.options)
        tableOptions = params.options;
    const tblElem = document.createElement("table");
    if (tableOptions && tableOptions.styling && typeof tableOptions.styling.table == "undefined") {
        tblElem.style.width = "auto";
        tblElem.style.margin = "2em auto";
    }
    if (tableOptions && tableOptions.styling && tableOptions.styling.col) {
        //		colgrpElem = document.createElement("colgroup");
        //		tblElem.appendChild(colgrpElem);
        for (const col of tableOptions.styling.col)
            if (typeof col !== "undefined" && col) {
                colStyle = "";
                for (const style in col)
                    //			if (col.hasOwnProperty(style))
                    colStyle += `${style}:${col[style]}`;
                colElem = document.createElement("col");
                //			colgrpElem.appendChild(colElem);
                tblElem.appendChild(colElem);
                colElem.setAttribute("style", colStyle);
                colWidths.push(myICss.getEffectiveElementWidth(colElem));
            }
    }
    // Adding a caption to the table
    if (params.title) {
        captionElem = document.createElement("caption");
        tblElem.appendChild(captionElem);
        captionElem.appendChild(document.createTextNode(params.title.text));
        if (params.title.attribs)
            setElementCssProperties(params.title.attribs, captionElem.style);
        else
            setElementCssProperties(defaultCaptionTitleStyling, captionElem.style);
        // Adding a subtitle
        if (params.subtitle) {
            pNode = document.createElement("p");
            captionElem.appendChild(pNode);
            pNode.appendChild(document.createTextNode(params.subtitle.text));
            if (params.subtitle.attribs)
                setElementCssProperties(params.subtitle.attribs, pNode.style);
            else
                setElementCssProperties(defaultCaptionSubtitleStyling, pNode.style);
        }
    }
    else {
    }
    // this attaches the table to the existing node in the document
    if (!params.attach) {
        console.warn(`an invalid parent/attachment DOM element was passed to makeTable(): ${params.attach}`);
        throw new Error(`an invalid parent/attachment DOM element was passed to makeTable(): ${params.attach}`);
    }
    params.attach.appendChild(tblElem);
    // adding the table headers
    trElem = document.createElement("tr");
    tblElem.appendChild(trElem);
    for (i = 0; i < totalColumns; i++) {
        // add the column for row counting
        if (tableOptions && tableOptions.addRowCounting && tableOptions.addRowCounting.by != 0 &&
            i == totalColumns - 1) {
            tdNode = document.createElement("th");
            trElem.appendChild(tdNode);
            tdNode.appendChild(document.createTextNode("#"));
        }
        // rest of headers
        tdNode = document.createElement("th");
        trElem.appendChild(tdNode);
        headerTitle = typeof params.headers[i] == "string" ? params.headers[i] :
            params.headers[i].title;
        if (typeof params.headers[i] != "string" && params.headers[i].style)
            tdNode.setAttribute("style", params.headers[i].style);
        tdNode.appendChild(document.createTextNode(headerTitle));
    }
    // if no data supplied
    if (params.data.length == 0) {
        if (tableOptions && tableOptions.emptyTable == false) {
            trElem = document.createElement("tr");
            tblElem.appendChild(trElem);
            tdNode = document.createElement("td");
            trElem.appendChild(tdNode);
            tdNode.setAttribute("colspan", params.headers.length.toString() + 1);
            tdNode.appendChild(document.createTextNode("No data was found in the call."));
            tdNode.style.fontWeight = "bold";
            tdNode.style.fontSize = "150%";
            tdNode.style.color = "red";
        }
        return tblElem;
    }
    // there is data
    for (const item of params.data) {
        if (params.headers.length > 1 ||
            (params.headers.length < 2 && tableOptions && tableOptions.columns
                && totalColumns < tableOptions.columns)) {
            trElem = document.createElement("tr");
            tblElem.appendChild(trElem);
        }
        // The 'header' and 'display' element counts should be checked here
        // This loop below now starts to work the 'display' property
        // the option available will column with a row counter
        if (params.display.length == 0 && Array.isArray(item) == true)
            for (const elem of item) {
                tdNode = document.createElement("td");
                trElem.appendChild(tdNode);
                tdNode.appendChild(document.createTextNode(elem));
            }
        else
            for (let i = 0; i < params.display.length; i++) {
                if (tableOptions && tableOptions.addRowCounting && i == totalColumns - 1) {
                    // this creates a left-size row column counter as an option
                    tdNode = document.createElement("th");
                    trElem.appendChild(tdNode);
                    tdNode.appendChild(document.createTextNode(rowCounter.toString()));
                    rowCounter++;
                }
                tdNode = document.createElement("td");
                trElem.appendChild(tdNode);
                // this invokes a function call to evaluate the display element and return the value
                // this can be null -- if a problem, check the data
                if ((value = params.display[i](item)) == null)
                    if (tableOptions && tableOptions.onNull)
                        value = tableOptions.onNull;
                    else
                        value = "null -- check data or set options on null values";
                // value is checked for its type: this is if string
                if (typeof value == "string") {
                    if (value.search(/\$\$/) >= 0)
                        setCellValue(item, value, null); // run the special $$ setup
                    else // or just enter the value
                        tdNode.appendChild(document.createTextNode(value));
                }
                else if (value.iValue) { // value is object with property 'iValue'
                    if (typeof value.iValue == "string") {
                        //						if (value.iValue.length > myICss.MAX_STRING_CHECK_FOR_COLUMN)
                        //							myICss.adjustWordStyleForTableColumn(value.iValue, tdNode, testWidthElement);
                        if (value.iValue.search(/\$\$/) >= 0 || value.wrapLink)
                            setCellValue(item, value.iValue, value.wrapLink);
                        else
                            tdNode.appendChild(document.createTextNode(value.iValue));
                    } // if value has 'attrib' property
                    if (value.attrib && value.attrib.length && value.attrib.length > 0) {
                        const attribs = value.attrib.split(";;");
                        let attribName, attribVal;
                        for (const attrib of attribs) {
                            [attribName, attribVal] = attrib.split("=");
                            switch (attribName) {
                                case "class":
                                    tdNode.className = attribVal;
                                    break;
                                case "id":
                                    tdNode.id = attribVal;
                                    break;
                                case "style":
                                    tdNode.setAttribute("style", attribVal);
                                    break;
                            }
                        }
                    }
                }
                else if (typeof value == "object" && value != null) {
                    tdNode.appendChild(document.createTextNode("\u00a0"));
                    //					if (value.textContent.length > myICss.MAX_STRING_CHECK_FOR_COLUMN)
                    //						myICss.adjustWordStyleForTableColumn(value.textContent, tdNode, testWidthElement);
                    tdNode.replaceChild(value, tdNode.firstChild);
                }
            }
    }
    document.body.removeChild(testWidthElement);
    return tblElem;
    /**
     *
     * @param item
     * @param value
     * @param wrapLink
     */
    function setCellValue(item, value, wrapLink, type) {
        //  for "$$<object properties>"
        const varsVals = [];
        let //index,
        //part,
        vars;
        // extract the property string from any larger string
        if ((vars = value.match(/\$\$[A-Za-z0-9]+/g)) != null)
            for (const var$ of vars)
                varsVals.push(item[var$.substring(2)]);
        if (vars != null)
            for (let i = 0; i < (vars === null || vars === void 0 ? void 0 : vars.length); i++)
                value = value.replace(vars[i], varsVals[i]);
        /*
                if ((index = (value).split(".")).length > 1) {
                    cItem = item[index.shift() as string];
                    while (typeof (part = index.shift()) !== "undefined")
                        value = cItem[part];
                } else
                    value = item[value]; */
        //		if (value.length > myICss.MAX_STRING_CHECK_FOR_COLUMN)
        //			myICss.adjustWordStyleForTableColumn(value, tdNode,// testWidthElement);
        if (wrapLink && wrapLink.length > 0) {
            const anchor = document.createElement("a");
            anchor.href = wrapLink;
            anchor.target = "_blank";
            anchor.appendChild(document.createTextNode(value));
            tdNode.appendChild(anchor);
        }
        else
            tdNode.appendChild(document.createTextNode(value));
    }
}
function setElementCssProperties(attribs, styleProperty) {
    if (attribs.textAlign)
        styleProperty.textAlign = attribs.textAlign;
    if (attribs.fontSize)
        if (typeof attribs.fontSize == "number")
            styleProperty.fontSize = attribs.fontSize.toString() + "px";
        else
            styleProperty.fontSize = attribs.fontSize;
    if (attribs.verticalAlign)
        styleProperty.verticalAlign = attribs.verticalAlign;
    if (attribs.fontFamily)
        styleProperty.fontFamily = attribs.fontFamily;
    if (attribs.fontStyle)
        styleProperty.fontStyle = attribs.fontStyle;
    if (attribs.fontWeight)
        styleProperty.fontWeight = attribs.fontWeight;
    if (attribs.color)
        styleProperty.color = attribs.color;
    if (attribs.backgroundColor)
        styleProperty.backgroundColor = attribs.backgroundColor;
    if (attribs.opacity)
        styleProperty.opacity = attribs.opacity.toString();
    if (attribs.margin)
        styleProperty.margin = attribs.margin;
    if (attribs.width)
        styleProperty.width = attribs.width;
    if (attribs.padding)
        styleProperty.padding = attribs.padding;
    if (attribs.border)
        styleProperty.border = attribs.border;
    if (attribs.borderRadius)
        styleProperty.borderRadius = attribs.borderRadius;
    if (attribs.textDecoration)
        styleProperty.textDecoration = attribs.textDecoration;
    if (attribs.textTransform)
        styleProperty.textTransform = attribs.textTransform;
    if (attribs.visibility)
        styleProperty.visibility = attribs.visibility;
}
//# sourceMappingURL=makeTable.js.map