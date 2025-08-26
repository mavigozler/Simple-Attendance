"use strict";
import { areEqual } from "./numberExtended.js";
export { MathOperation, iCss // class
 };
/*debugging;
cssStyleDeclType = typeof(cssStyleDeclaration);
if (cssStyleDeclType == "function" || cssStyleDeclType == "object") {
    if (typeof(cssStyleDeclaration.setProperty) == "undefined") {
        cssStyleDeclaration.prototype.setProperty = function (propertyName,
                    propertyValue, propertyPriority) {
            if ()
        }
    }
}*/
var MathOperation;
(function (MathOperation) {
    MathOperation[MathOperation["CSS_SUM"] = 0] = "CSS_SUM";
    MathOperation[MathOperation["CSS_MULTIPLY"] = 1] = "CSS_MULTIPLY";
    MathOperation[MathOperation["CSS_DIVIDE"] = 2] = "CSS_DIVIDE";
})(MathOperation || (MathOperation = {}));
class iCss {
    //  match[1] = integer/whole, match[2] = flat, match[3]=whole/int percentage
    //   match[4] = float percentage, match[5] = string dim
    constructor() {
        this.MAX_STRING_CHECK_FOR_COLUMN = 12;
        this.fonts = [
            { px: 13.3333, pt: 10 },
            { px: 12, pt: 9 },
            { px: 10.6667, pt: 8 },
            { px: 9.3333, pt: 7 }
        ];
        // the constructor
    }
    getFirstInternalStylesheet(doc, createIfNull = false) {
        let i, href, styleElem;
        for (i = 0; i < doc.styleSheets.length; i++) {
            href = doc.styleSheets[i].href;
            if (href == null || href == "")
                break;
        }
        if (i == doc.styleSheets.length) {
            if (createIfNull != true)
                return;
            styleElem = doc.createElement("style");
            //	styleElem.type = "text/css";
            doc.head.appendChild(styleElem);
            return this.getFirstInternalStylesheet(doc, false);
        }
        return doc.styleSheets[i];
    }
    /**
     * createStyleSheet() creates a style sheet within the DOM
    * @param urlOrRules {String|undefined|null}
      - url path to a file of type 'css' that specifies an external stylesheet
            - a long string of one or more valid rules in "selector {propertyName:propertyValue;...} format
            as one might find in the contained text of a style element
            the string MUST be stripped of all newlines '\n' characters
      - if undefined or null, will create an internal stylesheet
    * @returns object reference of type styleSheet in Windows or of type style or link element
    *  if using IE 5 and later for Macintosh
    */
    createStyleSheet(doc, urlOrRules) {
        const rulesRE = /([\w-]?[#.]?[\w-]+(\s+[\w\-*>]+)*)\s*\{([^}]+)\}/g, ruleRE = /(.*)\s*\{([^}]+)\}/, rules = typeof urlOrRules == "string" ? urlOrRules.match(rulesRE) : undefined, allRules = [];
        let i, returnedValue, styleSheet, linkElem, styleElem, rule;
        if (!rules)
            return;
        /*
        if (document.createStyleSheet) {
        if (typeof urlOrRules == "undefined" || urlOrRules == null)
        return document.createStyleSheet();
        else if (typeof rules == "undefined" || rules == null)
        return document.createStyleSheet(urlOrRules);
        styleSheet = document.createStyleSheet();
        } else if (typeof urlOrRules == "undefined" || urlOrRules == null) {
        */
        if (typeof urlOrRules == "undefined" || urlOrRules == null) {
            // an empty internal style sheet is wanted and returned
            styleElem = doc.createElement("style");
            styleElem.setAttribute("media", "screen");
            styleElem.appendChild(doc.createTextNode("")); //WebKit hack
            doc.head.appendChild(styleElem);
            return this.getFirstInternalStylesheet(doc);
        }
        else if (typeof rules == "undefined" || rules == null) {
            // an external style sheet is called, the string must be a URL
            linkElem = doc.createElement("link");
            linkElem.type = "text/css";
            linkElem.href = urlOrRules;
            doc.head.appendChild(linkElem);
            return this.getFirstInternalStylesheet(doc);
        }
        // get the document's internal stylesheet
        if ((styleSheet = this.getFirstInternalStylesheet(doc, true)) == null)
            throw "iCss.createStyleSheet(): unable to return internal stylesheet";
        for (i = 0; i < rules.length; i++)
            if ((rule = rules[i].match(ruleRE)) != null)
                allRules.push(rule[1], rule[2]);
        if (styleSheet.insertRule) {
            for (i = 0; i < allRules.length; i += 2)
                if ((returnedValue = styleSheet.insertRule(allRules[i] + " { " + allRules[i + 1] + " } ", styleSheet.cssRules.length)) < 0)
                    throw "styleSheet.insertRule() exception #" + returnedValue;
            //	else
            //		console.log("insertRule: " + allRules[i] + " { " + allRules[i + 1] + " } ");
        }
        else if (styleSheet.addRule) {
            for (i = 1; i < allRules.length; i += 2)
                styleSheet.addRule(allRules[i], allRules[i + 1]);
            //	console.log("addRule: " + allRules[i] +","+ allRules[i + 1] + " } ");
        }
        return styleSheet;
    }
    /**
     * findStyleSheet(hrefPart) returns a CSSStyleSheet object whose name is contained
     *   and any part of the parameter
     * @param {String} hrefPart: a substring of any stylesheet href part
     * @returns CSSStyleSheet object from documents.styleSheets collection
     */
    findStyleSheet(hrefPart) {
        if (!document || !document.styleSheets)
            throw "'document' object or its property 'styleSheets' collection not found";
        for (let i = 0; i < document.styleSheets.length; i++)
            if (document.styleSheets[i].href.search(hrefPart) >= 0)
                return document.styleSheets[i];
        return null;
    }
    /**
     * getCssRule() returns a CSS rule from inspecting one or all style sheets
     * @param {String} selector: the element, id or class attribute for which the rule is wanted
     * @param {StyleSheet} styleSheet [optional]: will only search this stylesheet
     * @returns a cssRule object as specified in the DOM Style specification
     *      this should be an enumeration of CSS properties and their values
     */
    getCssRule(selector, styleSheet = null) {
        let i, j, rule = null, sheet;
        const searchThisStyleSheet = (selector, sheet, isIE) => {
            let rule, styleRule;
            if (isIE == true)
                for (j = 0; j < sheet.cssRules.length; j++) {
                    rule = sheet.cssRules[j];
                    // Rule Types not defined in IE DOM
                    if ((styleRule = rule) && styleRule.selectorText && styleRule.selectorText.toLowerCase() == selector.toLowerCase())
                        return styleRule;
                }
            else // standard CSS DOM
                for (j = 0; j < sheet.cssRules.length; j++) {
                    rule = sheet.cssRules[j];
                    // Rule Type 1 is a Style Rule
                    if ((rule.type == CSSRule.STYLE_RULE) && (rule.cssText.toLowerCase() == selector.toLowerCase()))
                        return rule;
                }
            return null;
        };
        if (typeof selector != "string")
            throw "a selector parameter of type 'string' is required";
        if (selector.search(/\s*(\S+)\s*\{.+\}/) >= 0)
            selector = selector.match(/\s*(\S+)\s*\{.+\}/)[1];
        if (styleSheet) // search this one
            rule = searchThisStyleSheet(selector, styleSheet, false);
        else //  search all stylesheets
            for (i = 0; i < document.styleSheets.length; i++) {
                if (document.styleSheets.item) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        sheet = document.styleSheets.item(i);
                    }
                    catch (_a) {
                        continue;
                    }
                    if ((rule = searchThisStyleSheet(selector, document.styleSheets.item(i), true)) != null)
                        break;
                }
                else if ((rule = searchThisStyleSheet(selector, document.styleSheets[i], false)) != null)
                    break;
            }
        return rule;
    }
    /**
     * setCssRule() returns a CSS rule from inspecting one or all style sheets
     * @param {string} selector: the element, id or class attribute for which the rule is wanted
     * @param {string} properties: properties to be created
     * @param {number | styleSheet | string} styleSheet [optional]: can be numeric for index
     *    of document stylesheet or string naming a css file
     *      if omitted; if styleSheet does not exist, returns failure
     * @returns {boolean} true if successful, false if not
     */
    setCssRule(selector, properties, styleSheet) {
        //	if (typeof selector != "string")
        //		throw "a selector parameter of type 'string' is required";
        //	if (typeof properties != "string")
        //		throw "a selector parameter of type 'string' is required";
        if (styleSheet) {
            if (typeof styleSheet == "number" && document.styleSheets[styleSheet])
                styleSheet = document.styleSheets[styleSheet];
            else {
                const regex = new RegExp(styleSheet);
                let i;
                for (i = 0; i < document.styleSheets.length; i++)
                    if (document.styleSheets[i].href.search(regex) >= 0)
                        break;
                if (i < document.styleSheets.length)
                    styleSheet = document.styleSheets[i];
            }
        }
        else
            styleSheet = document.styleSheets[0];
        if (properties.search(/^\s*\{/) < 0)
            properties = "{" + properties + "}";
        try { // IE gives a problem!
            styleSheet.insertRule(selector + " " + properties);
        }
        catch (_a) {
            styleSheet.insertRule(selector + " " + properties, 0);
        }
    }
    /**
     * getElemComputedStyle() looks for the particular style property of the
     *   specified element elem, and whether there is a pseudo element attached
     *   e.g. hover, visited, etc.
     * @param {object} elem the reference to the DOM object of type ELEMENT
     * @param {string} pseudoElem the class modification to the element, where possible
     * @param {string} styleProperty the string specifying a valid CSS property
     * @param {boolean} persistentSearch default=false; if true, the property value
     *    will be searched for a non-null value in all ancestors (containing
     *    parent elements) in a recursive way
     * @returns can return a wide variety of values, usually strings, and with
     *   valid CSS values; will return a value of null if no value found
     */
    getElemComputedStyle(node, pseudoElem, styleProperty) {
        const elem = node, helem = node;
        let computedValue = null, parenNode = node, t;
        do {
            if (typeof window.getComputedStyle == "function" &&
                (computedValue = window.getComputedStyle(elem, pseudoElem).getPropertyValue(styleProperty)).length > 0)
                t = null;
            else if (document.defaultView && document.defaultView.getComputedStyle &&
                (computedValue = document.defaultView.getComputedStyle(elem, pseudoElem).getPropertyValue(styleProperty)).length > 0)
                t = null;
            else if (helem.style && (computedValue = helem.style.getPropertyValue(styleProperty)).length > 0)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                t = null;
            else if (typeof helem.offsetLeft != "undefined" && typeof helem.offsetWidth != "undefined")
                computedValue = (helem.offsetWidth - helem.offsetLeft).toString(10);
        } while ((computedValue == null ||
            (typeof computedValue == "string" && computedValue.toLowerCase() == "transparent")) &&
            (parenNode = parenNode.parentNode) != null);
        return computedValue;
    }
    /**
     * isCssAboluteSize() determines whether a size was given as "absolute", either
     *   as a string of "xx-small" to "xx-large" or as a number from 1 to 7
     *   this function provides a support role for other functions in this JS file
     * @param {String|Number} cssVal type must be string or number corresponding to special css Value
     * @returns boolean true if value is a CSS absolute value, false if anything else
     */
    isCssAbsoluteSize(cssVal) {
        if (typeof cssVal == "string") {
            const absoluteSizeVals = ["xx-small", "x-small", "small", "medium",
                "large", "x-large", "xx-large"
            ];
            for (let i = 0; i < absoluteSizeVals.length; i++)
                if (cssVal == absoluteSizeVals[i])
                    return true;
        }
        else if (typeof cssVal == "number")
            if (cssVal >= 1 && cssVal <= 7)
                return true;
        return false;
    }
    /**
     * isCssRelativeSize() determines whether a size was given as relative
     *   i.e., CSS value was something like "larger" or "smaller"
     *   this function provides a support role for other functions in this JS file
     * @param {no restriction} cssVal type must be string or number corresponding to special css Value
     * @returns boolean true if value a CSS relative value, viz. strings "larger" or "smaller"
     *    false if anything else
     */
    isCssRelativeSize(cssVal) {
        if (cssVal == "larger" || cssVal == "smaller")
            return true;
        return false;
    }
    /**
     * isCssFontWeight() determines whether a font weighting was given as a word value
     *   such as "normal", "bold", etc or as a number of some kind
     *   this function provides a support role for other functions in this JS file
     * @param {String|Number} cssVal type must be string or number corresponding to special css Value
     * @returns boolean true if value is a valid CSS font weighting value
     *    false if anything else
     */
    isCssFontWeight(cssVal) {
        const c = ["normal", "bold", "bolder", "lighter"];
        let i;
        if (typeof cssVal === "string" && isNaN(parseInt(cssVal)) == false) {
            for (i = 0, cssVal = Number(cssVal); i < 9; i++)
                if (cssVal === (i + 1) * 100)
                    return true;
        }
        else if (typeof (cssVal) == "string") {
            for (i = 0; i < c.length; i++)
                if (cssVal == c[i])
                    return true;
        }
        return false;
    }
    /**
     * getCssLineHeight() obtains the numeric value for a line height specifier in a CSS
     *   font size property value.  CSS lets a font size have the form "1.4em/1.7em"
     *   where the format is font-size/line-height
     *   this function is largely handled by getCssFontSize(), as it has same method
     * @param {String|Number} cssVal type must be string or number
     * @returns Number corresponding to the line height
     */
    getCssLineHeight(cssVal) {
        return this.getCssFontSize(cssVal, true);
    }
    /**
     * getCssFontSize() obtains the numeric value for a font size specifier in a CSS
     *   font size property value.  CSS lets a font size have the form "1.4em/1.7em"
     *   where the format is font-size/line-height
     *   this function is provides a support role for other functions in the JS file
     * @param {String|Number} cssVal type must be string or number
     * @param {boolean} getLineHeight unset or undefined if getCssFontSize called, but
     *     true if getCssLineHeight called it, in order to find y in the format x/y
     * @returns Number corresponding to the font size
     */
    getCssFontSize(cssVal, getLineHeight = false) {
        if (typeof cssVal == "number")
            return cssVal;
        else if (typeof cssVal == "string") {
            if (typeof getLineHeight == "boolean" && getLineHeight == true)
                if (cssVal.search(/\//) > 0)
                    cssVal = cssVal.split("/")[1];
                else
                    return null;
            else if (cssVal.search(/\//) > 0)
                cssVal = cssVal.split("/")[0];
            if (cssVal == "inherit")
                return cssVal;
            if (cssVal.search(iCss.CssValue) == 0 ||
                this.isCssAbsoluteSize(cssVal) == true ||
                this.isCssRelativeSize(cssVal) == true ||
                this.isCssLength(cssVal) == true)
                return cssVal;
        }
        return null;
    }
    // support functions
    isFontWeight(testString) {
        const fontWeights = ["normal", "bold", "bolder", "lighter", "100", "200", "300",
            "400", "500", "600", "700", "800", "900"
        ];
        for (let i = 0; i < fontWeights.length; i++)
            if (testString === fontWeights[i])
                return true;
        return false;
    }
    isCssLength(testString) {
        if (testString.trim().search(iCss.CssValue) >= 0)
            return true;
        return false;
    }
    /**
    * cssParser() takes a CSS definition AS A string, and uses it to style a DOM element
    *  or to divide the definition into an array of strings.
    * @param {HTMLElement | string[]} domElemOrArray if DOM element, the style is made
    *   attributes of element; if array, string is split and returned in the array
    * @param {string} cssDef contains the definition (selectors and their properties)
    *    in valid CSS
    * @return {null|array} true if DOM element was passed and the CSS definition
    *   was successfully parsed and attributed; false if there was a problem of any kind;
    *   returns an array if array was passed and the CSS definition successfully parsed
    * @type Boolean or Array
    The CSS spec for 'font' property is:
    [[<font-style>||<font-variant>||<font-weight>]? <font-size>[/<line-height>]?
    <font-family>]|caption|icon|menu|message-box|small-caption|status-bar|inherit
    Permitted values are
    font-style: normal|italic|oblique|inherit
    font-variant: normal|small-caps|inherit
    font-weight: normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900|inherit
    font-size: <absolute-size>|<relative-size>|<length>|<percentage>|inherit
    line-height: normal|<number>|<length>|<percentage>|inherit
    font-family: [[<family-name>|<generic-family>][,family-name|<generic-family>]*]|inherit
    Note that
    */
    cssParser(domElemOrArray, cssDef) {
        const fontCategories = ["caption", "icon", "menu", "message-box",
            "small-caption", "status-bar"
        ], colorValueRE = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\(\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)|rgb\(-?\d{1,3}\s*,-?\s*\d{1,3}\s*,\s*-?\d{1,3}\s*\)/, properties = cssDef.split(";"), domElem = Array.isArray(domElemOrArray) == false ? domElemOrArray : null, arrayArg = Array.isArray(domElemOrArray) == true ? domElemOrArray : null;
        let property, def, val, box, modifier, firstPart, font, fontWeight, fontVariant, fontSize, lineHeight, cssFont, fontFamily, fontStyle;
        if (typeof domElemOrArray === "undefined" ||
            (typeof domElemOrArray.nodeType != "undefined" &&
                domElemOrArray.nodeType != 1 && Array.isArray(domElemOrArray) == false) ||
            typeof cssDef != "string")
            return false;
        for (let i = 0, j = 0; i < properties.length; i++) {
            property = properties[i].split(":");
            switch (property[0]) { // property name
                case "color":
                case "background-color":
                    if (property[1].search(colorValueRE) < 0)
                        continue;
                    if (property[0] == "background-color")
                        property[0] = "backgroundColor";
                    if (Array.isArray(domElemOrArray) == true)
                        arrayArg.push(property[0], property[1]);
                    else
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        domElem.style[property[0]] = property[1];
                    break;
                case "width":
                case "height":
                    if ((val = this.doCssMath(MathOperation.CSS_SUM, property[1], 0)) == null)
                        continue;
                    if (arrayArg != null)
                        arrayArg.push(property[0], val);
                    else if (domElem)
                        domElem.style[property[0]] = val;
                    break;
                case "font":
                    for (; j < fontCategories.length; j++)
                        if (property[1] == fontCategories[j])
                            break;
                    if (j == fontCategories.length) {
                        // check for multiple font families with comma (,) character
                        def = property[1].replace(/"/, "'");
                        if (def.search(/'/) >= 0) { // font family with quotes
                            def = def.split(/'/);
                            firstPart = def.shift().split(/\s+/);
                            for (j = firstPart.length - 1; j >= 0; j--)
                                if (firstPart[j].search(/,/) >= 0)
                                    def.unshift(firstPart.pop());
                            for (j = 0; j < def.length; j++)
                                if (def[j].search(/\s/) >= 0)
                                    def[j] = "'" + def[j] + "'";
                            def = def.join("");
                        }
                        else { // font family with perhaps only commas
                            def = def.split(/,/);
                            firstPart = def.shift().split(/\s+/);
                            def.unshift(firstPart.pop());
                            def = def.join(",");
                        }
                        def = firstPart.concat(def);
                        for (j = def.length - 1; j >= 0; j--)
                            if (def[j] == "")
                                def.splice(j, 1);
                        for (j = 0; j < def.length; j++)
                            if (def[j] == "normal") {
                                switch (def.length) {
                                    case 2:
                                        if (j > 0)
                                            return false;
                                        fontStyle = def[j];
                                        break;
                                    case 3:
                                        if (j > 1)
                                            return false;
                                        if (j == 1)
                                            fontWeight = def[j];
                                        else
                                            fontStyle = def[j];
                                        break;
                                    case 4:
                                        if (j > 2)
                                            return false;
                                        if (j == 2)
                                            fontWeight = def[j];
                                        else if (j == 1)
                                            fontVariant = def[j];
                                        else
                                            fontStyle = def[j];
                                        break;
                                    case 5:
                                        if (j == 0)
                                            fontStyle = def[j];
                                        else if (j == 1)
                                            fontVariant = def[j];
                                        else if (j == 2)
                                            fontWeight = def[j];
                                        else
                                            return false;
                                        break;
                                    default:
                                        return false; // formatting error
                                }
                            }
                            else if (def[j] == "italic" || def[j] == "oblique")
                                fontStyle = def[j];
                            else if (def[j] == "small-caps")
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                fontVariant = def[j];
                            else if (this.isFontWeight(def[j]) == true)
                                fontWeight = def[j];
                            else if ((val = this.getCssLineHeight(def[j])) != null)
                                lineHeight = val;
                            else if ((val = this.getCssFontSize(def[j])) != null)
                                fontSize = val;
                            else { // likely a font family
                                def.splice(0, j);
                                fontFamily = def.join("");
                                j = def.length;
                            }
                    }
                    else
                        cssFont = property[1];
                    break;
                case "font-size":
                    if (property[0] == "font-size" &&
                        (val = this.getCssFontSize(property[1])) != null)
                        fontSize = val;
                    break;
                case "font-weight":
                    if (property[0] == "font-weight" &&
                        this.isFontWeight(property[1]) == true)
                        fontWeight = properties[i + 1];
                    break;
                case "font-family":
                    if (property[0] == "font-family")
                        fontFamily = property[1];
                    break;
                case "font-style":
                    if (property[0] == "font-style" &&
                        (property[1] == "italic" || property[1] == "oblique"))
                        fontStyle = property[1];
                    break;
                case "line-height":
                    if (property[0] == "line-height" &&
                        (val = this.getCssLineHeight(property[1])) != null)
                        lineHeight = val;
                    break;
                case "float":
                    if (arrayArg)
                        arrayArg.push("cssFloat", property[1]);
                    else if (domElem)
                        domElem.style.cssFloat = property[1];
                    break;
                default:
                    if ((box = property[0].match(/margin|padding|border/)) != null) {
                        if ((modifier = property[0].match(/-(top|bottom|right|left)/)) != null)
                            modifier = modifier[1].charAt(0).toUpperCase() + modifier[1].substring(1);
                        else // no modifier!
                            modifier = "";
                        /*
                        if (box[0] == property[0]) {
                        propValues = property[1].split(/\s+/)
                        if (propValues.length == 1)
                        else if (propValues.length == 2)
                        else if (propValues.length == 4)
                        else
                        return false;
                        }
                        */
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        domElem.style[(box + modifier)] = property[1];
                    }
                    else if (domElem && (box = property[0].match(/(\w+)-(\w)(\w+)/)) != null)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        domElem.style[(box[1] + box[2].toUpperCase() + box[3])] = property[1];
                    else if (domElem && property[0].length > 0)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        domElem.style[property[0]] = property[1];
                    break;
            }
        }
        // specially defined properties
        if (domElem) {
            if (fontSize)
                domElem.style.fontSize = fontSize;
            if (lineHeight)
                domElem.style.lineHeight = lineHeight;
            if (fontWeight)
                domElem.style.fontWeight = fontWeight;
            if (fontStyle)
                domElem.style.fontStyle = fontStyle;
            if (fontFamily)
                domElem.style.fontFamily = fontFamily;
            if (cssFont)
                domElem.style.font = cssFont;
        }
        else if (arrayArg) {
            if (typeof fontSize != "undefined")
                arrayArg.push("font-size", fontSize);
            if (typeof lineHeight != "undefined")
                arrayArg.push("line-height", lineHeight);
            if (typeof fontWeight != "undefined")
                arrayArg.push("font-weight", fontWeight);
            if (typeof fontStyle != "undefined")
                arrayArg.push("font-style", fontStyle);
            if (typeof fontFamily != "undefined")
                arrayArg.push("font-family", fontFamily);
            if (typeof cssFont != "undefined")
                arrayArg.push("font", font);
        }
        if (arrayArg)
            return arrayArg;
        return true;
    }
    /**
     * doCssMath() allows math operations (CSS_SUM or CSS_MULTIPLY) to be done on
     *   CSS values having different dimensions
     * @param {constant} operation number which must be either CSS_SUM or CSS_MULTIPLY
     * @param {string|array|number} val1  this can be any valid CSS value, including
     *   numbers with dimensions as strings.  If it is an array, its elements will
     *   be evaluated
     * @param {string|array|number} val2 can be the same type as val1 and val1
     *   description applies
     * @return {string} the evaluation of the operated parameters with the dimension
     *   found
     */
    doCssMath(operation, val1, val2) {
        let i, setDim = "", val1array, val1_dim, val2_dim, sum = 0, prod = 0; // match results of examing a CSS length string
        if ((typeof val1 == "string" && val1.search(iCss.CssValue) < 0) ||
            (typeof val2 == "string" && val2.search(iCss.CssValue) < 0))
            return null;
        if (operation == MathOperation.CSS_SUM) {
            if (Array.isArray(val1) == true) {
                val1array = val1;
                for (i = 0; i < val1array.length; i++) {
                    if ((val1_dim = this.extractValueDim(val1array[i])) == null)
                        return null;
                    if (i == 0)
                        setDim = val1_dim.dim;
                    else if (val1_dim.dim != setDim)
                        return null;
                    sum += val1_dim.val;
                }
            }
            else if (val1 && val2) {
                val1_dim = this.extractValueDim(val1);
                val2_dim = this.extractValueDim(val2);
                if (val1_dim != null && val2_dim != null)
                    val1_dim.dim = val2_dim.dim;
                else if (val1_dim && val1_dim.val != 0 && val2_dim && val2_dim.val == 0)
                    val2_dim.dim = val1_dim.dim;
                if (val1_dim && val2_dim && val1_dim.dim != val2_dim.dim)
                    return null;
                if (val1_dim && val2_dim)
                    sum = val1_dim.val + val2_dim.val;
            }
            return sum.toString() + val1_dim.dim;
        }
        else if (operation == MathOperation.CSS_MULTIPLY) {
            if (Array.isArray(val1) == true)
                for (i = 0; i < val1.length; i++) {
                    if ((val1_dim = this.extractValueDim(val1[i])) == null)
                        return null;
                    if (i == 0)
                        setDim = val1_dim.dim;
                    else if (val1_dim.dim != setDim)
                        return null;
                    prod *= val1_dim.val;
                }
            else {
                val1_dim = this.extractValueDim(val1);
                const val2_dim = this.extractValueDim(val2);
                if (val2_dim != null && val2 != val2_dim.val &&
                    val1_dim != null && val1 != val1_dim.val && val1_dim.val != val2_dim.val)
                    return null;
                if (val1_dim != null && val1_dim.dim)
                    setDim = val1_dim.dim;
                else
                    setDim = val2_dim != null ? val2_dim.dim : "";
                prod = val1_dim != null && val2_dim != null ? val1_dim.val * val2_dim.val : undefined;
            }
            return (typeof prod == "undefined" ? null : prod.toString() + setDim);
        }
        return null;
    }
    extractValueDim(cssVal) {
        let components;
        const retVal = {};
        if (typeof cssVal === "number")
            return { val: cssVal, dim: "" };
        if (typeof cssVal !== "string")
            return null;
        if ((components = cssVal.match(iCss.CssValue)) == null)
            return null;
        //	if (components.length != 3 && cssVal != components[1])
        //	return null;
        if (components[1])
            retVal.val = parseInt(components[1]);
        else if (components[2])
            retVal.val = parseFloat(components[2]);
        else if (components[3])
            retVal.dim = components[3];
        else if (components[4])
            retVal.dim = components[4];
        else if (components[5])
            retVal.dim = components[5];
        return retVal;
    }
    getClientWidth() {
        let theWidth;
        if (window.innerWidth)
            theWidth = window.innerWidth;
        else if (document.documentElement && document.documentElement.clientWidth)
            theWidth = document.documentElement.clientWidth;
        else if (document.body)
            theWidth = document.body.clientWidth;
        return theWidth;
    }
    getClientHeight() {
        let theHeight;
        if (window.innerHeight)
            theHeight = window.innerHeight;
        else if (document.documentElement && document.documentElement.clientHeight)
            theHeight = document.documentElement.clientHeight;
        else if (document.body)
            theHeight = document.body.clientHeight;
        return theHeight;
    }
    calculateWordWidth(word, fontSize, fontFamily, containingElement) {
        // create a temporary element to calculate the width of the word
        let tempElement;
        if (!containingElement) {
            tempElement = document.createElement("span");
            document.body.appendChild(tempElement);
        }
        else
            tempElement = containingElement;
        tempElement.style.fontSize = fontSize;
        tempElement.style.fontFamily = fontFamily;
        tempElement.style.whiteSpace = "nowrap";
        tempElement.innerHTML = word;
        // get the width of the word
        const wordWidth = tempElement.offsetWidth;
        // remove the temporary element
        if (!containingElement)
            document.body.removeChild(tempElement);
        return wordWidth;
    }
    getEffectiveElementWidth(element) {
        const { parentElement } = element;
        let parentComputedStyle, elementComputedStyle, elementWidth, parentWidth, effectiveColumnWidth;
        if (parentElement.offsetWidth == 0 || element.offsetWidth == 0) {
            parentComputedStyle = getComputedStyle(parentElement);
            elementComputedStyle = getComputedStyle(element);
            elementWidth = parseFloat(elementComputedStyle.getPropertyValue("width"));
            parentWidth = parseFloat(parentComputedStyle.getPropertyValue("width"));
        }
        else {
            parentWidth = parentElement.offsetWidth;
            elementWidth = element.offsetWidth;
            elementComputedStyle = getComputedStyle(element);
        }
        const columnPercentageWidth = (elementWidth / parentWidth) * 100;
        effectiveColumnWidth = (parentWidth * columnPercentageWidth) / 100;
        const padding = parseFloat(elementComputedStyle.getPropertyValue("padding-left")) + parseFloat(elementComputedStyle.getPropertyValue("padding-right"));
        const margin = parseFloat(elementComputedStyle.getPropertyValue("margin-left")) + parseFloat(elementComputedStyle.getPropertyValue("margin-right"));
        effectiveColumnWidth -= (padding + margin);
        return effectiveColumnWidth;
    }
    adjustWordStyleForTableColumn(word, colOrTdElem, testingElement) {
        const containerWidth = this.getEffectiveElementWidth(colOrTdElem), computedStyle = getComputedStyle(colOrTdElem);
        let wordWidth, computedFontSize, fontSize = computedStyle.getPropertyValue("font-size"), fontFamily = computedStyle.getPropertyValue("font-family");
        do {
            wordWidth = this.calculateWordWidth(word, fontSize, fontFamily, testingElement);
            if (wordWidth / containerWidth < 0.98) {
                colOrTdElem.style.fontSize = fontSize;
                colOrTdElem.style.fontFamily = fontFamily;
                break;
            }
            computedFontSize = parseFloat(fontSize);
            for (let i = 0; i < this.fonts.length; i++) {
                if (areEqual(this.fonts[i].px, computedFontSize) == true) {
                    if (this.fonts[i + 1])
                        fontSize = this.fonts[i + 1].px + "px";
                    else // time to change font family
                        fontFamily = "Arial Narrow";
                    break;
                }
            }
        } while (true);
    }
}
iCss.CssValue = /(\d+)|(\d*\.\d+)|(\d+%)|(\d*\.\d+%)(em|px|cm|in|mm|pt|pc|ex)/;
//# sourceMappingURL=iCss.js.map