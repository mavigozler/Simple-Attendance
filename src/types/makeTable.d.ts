type TTableDefinitionItem = {
    tag: string;
    originalUrl: string;
    created: Date;
    modified: Date;
    type: number;
    href: string;
    [key: string]: any;
};

type TMakeTableDisplayParam = (
	(arg?: any) => string | {attrib: string; iValue: string} | HTMLElement
)[];

type TMakeTableOptions = {
	columns?: number;
	columnWidths?: string[];
	addRowCounting?: {
		by: number;
	} | null;
	onNull?: string | (() => string);
	emptyTable?: boolean; // use to generate a table without anything in it.
	styling?: {
		table?: ElementCssProperties | null | undefined;
		col?: ElementCssProperties[] | null | undefined;
	}
} | null;

type EnhancedHeader = {
	title: string;
	style?: string;
};

type TMakeTableParams = {
	title: {
		text: string;
		attribs: ElementCssProperties | null | undefined;
	}
	subtitle?: {
		text: string;
		attribs: ElementCssProperties | null | undefined;
	}
	headers: EnhancedHeader[] | string[];
	data: any[];
	attach: HTMLDivElement;
	display: TMakeTableDisplayParam;
	options?: TMakeTableOptions;
 };

type ElementCssProperties = {	/** Sets the horizontal alignment of the caption */
	textAlign?: 'left' | 'center' | 'right' | 'justify' | 'initial' | 'inherit';
	/** Sets the vertical alignment of the caption */
	verticalAlign?: 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom' | 'initial' | 'inherit';
	/** Sets the font size of the caption */
	fontSize?: string | number;
	/** Sets the font family of the caption */
	fontFamily?: string;
	/** Sets the font style of the caption */
	fontStyle?: 'normal' | 'italic' | 'oblique' | 'initial' | 'inherit';
	/** Sets the font weight of the caption */
	fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number | 'initial' | 'inherit';
	/** Sets the color of the caption text */
	color?: string;
	/** Sets the background color of the caption */
	backgroundColor?: string;
	/** Sets the opacity of the caption */
	opacity?: number;
	/** Sets the margin of the caption */
	margin?: string;
	/** Sets the padding of the caption */
	width?: string;
	/** Sets the padding of the caption */
	padding?: string;
	/** Sets the border of the caption */
	border?: string;
	/** Sets the border radius of the caption */
	borderRadius?: string;
	/** Sets the text decoration of the caption */
	textDecoration?: 'none' | 'underline' | 'overline' | 'line-through' | 'initial' | 'inherit';
	/** Sets the text transform of the caption */
	textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | 'initial' | 'inherit';
	/** Sets the visibility of the caption */
	visibility?: 'visible' | 'hidden' | 'collapse' | 'initial' | 'inherit';
};
