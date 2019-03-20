'use strict'

const toString = require('lodash/toString')
const toNumber = require('lodash/toNumber')

const detectAccessible = (wheelchairBoarding) => {
	switch (wheelchairBoarding) {
	case '1':
		return true
	case '2':
		return false
	}
	return null
}

const createSchedule = (trip, starts, sequence) => ({
	// todo: block_id, shape_id
	type: 'schedule',
	id: toString(trip.trip_id),
	route: toString(trip.fptfRoute),
	sequence,
	starts,
	headsign: toString(trip.trip_headsign) || null,
	name: toString(trip.trip_short_name) || null,
	direction: toNumber(trip.direction_id) || null, // todo
	accessible: detectAccessible(trip.wheelchair_accessible),
	bicycles: detectAccessible(trip.bikes_allowed)
	// todo: sequence, starts
})

module.exports = createSchedule
