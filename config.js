module.exports = {
	'colors' : {
		'yellow' : '#B69545',
		'blacklighter': '#303030',
		'pozzolan': '#5D5053',
	},
	'primary': 'colors(yellow)',
	'secondary': 'colors(pozzolan)',

	'body': {
		'background': 'colors(blacklighter)',
		'block-background': 'lighten(colors(blacklighter),3%)',
		'font-color': 'colors(white)',
	},
	'footer': {
		'background': 'secondary',
		'font-color': 'contrastFW(colors(white),secondary)',
	},
	'input': {
		'background': 'colors(pozzolan)',
		'font-color': 'lighten(colors(pozzolan),60%)',
		'border-color': 'colors(none)',
		'placeholder-font-color': 'colors(greylight)',
		'radius': false,
	},
	'input-focus': {
		'background': 'lighten(input(background),10%)',
		'font-color': 'input(font-color)',
		'border-color': 'colors(none)',
	},
	'btn':{
		'background': 'primary',
		'font-color': 'contrastFW(colors(white),primary)',
		'border-size': 'border-default-size',
		'radius': false,
		'font-weight': 500,
	},
	'track-color':'rgba(colors(white),0.4)',
	'filll-color':'colors(white)',
	'thumb-color':'colors(white)',
};
