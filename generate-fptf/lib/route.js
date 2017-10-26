'use strict'

const toString = require('lodash.tostring')

const createRoute = (trip, stops) => ({
	type: 'route',
	id: toString(trip.trip_id),
	line: toString(trip.route_id),
	stops: stops.map(toString)
})

module.exports = createRoute
