'use strict'

const toString = require('lodash/toString')
const toNumber = require('lodash/toNumber')
const merge = require('lodash/merge')

const detectType = (stop) => {
	switch (stop.location_type) {
	case '1':
		return 'station'
	case '2':
		return 'entrance'
	}
	// case "0" or undefined
	if (!stop.parent_station) return 'station'
	return 'stop'
}

const detectAccessible = (wheelchairBoarding) => {
	switch (wheelchairBoarding) {
	case '1':
		return true
	case '2':
		return false
	}
	return null
}

const createStopOrStation = (stop) => {
	const type = detectType(stop)

	if (type === 'entrance') return { type }
	const stopOrStation = {
		id: toString(stop.stop_id),
		name: toString(stop.stop_name),
		code: toString(stop.stop_code) || null,
		description: toString(stop.stop_desc) || null,
		location: {
			type: 'location',
			longitude: toNumber(stop.stop_lon),
			latitude: toNumber(stop.stop_lat)
		},
		fareZone: toString(stop.zone_id) || null,
		url: toString(stop.stop_url) || null,
		timezone: toString(stop.stop_timezone) || null,
		accessible: detectAccessible(stop.wheelchair_boarding) // todo: is this correct?
	}

	if (type === 'station') return merge({ type }, stopOrStation)
	return merge({
		type,
		station: toString(stop.parent_station)
	}, stopOrStation)
}

module.exports = createStopOrStation
