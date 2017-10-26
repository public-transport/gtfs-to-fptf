'use strict'

const toString = require('lodash.tostring')
const toNumber = require('lodash.tonumber')

const detectMode = (type) => {
	switch(type){
		case "0":
			return 'train'
		case "1":
			return 'train'
		case "2":
			return 'train'
		case "3":
			return 'bus'
		case "4":
			return 'ferry'
		case "5":
			return 'train'
		case "6":
			return 'gondola' // todo: is this an approved type yet?
		case "7":
			return 'train'
	}
	return null // todo: throw error instead
}

const createLine = (routesPerLine) => (route) => ({
	type: 'line',
	id: toString(route.route_id),
	operator: toString(route.agency_id) || null, // todo: is this required? see also: GTFS specs
	routes: routesPerLine[route.route_id],
	name: toString(route.route_long_name),
	code: toString(route.route_short_name), // todo: is this correct/ok?
	description: toString(route.route_desc) || null,
	mode: detectMode(route.route_type), // todo: "product"?
	url: toString(route.route_url) || null,
	color: { // todo: nested vs. inline?
		text: toString(route.route_text_color) || null,
		background: toString(route.route_color) || null
	}
})

module.exports = createLine
