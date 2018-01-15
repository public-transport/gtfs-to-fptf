'use strict'

const randomId = require('unique-string')

const dataToDb = {
	agency: a => 'agency-' + a.agency_id,
	stops: s => 'stop-' + s.stop_id,
	routes: r => 'route-' + r.route_id,
	trips: t => 'trip-' + t.route_id + '-' + t.trip_id,
	stop_times: st => 'stop_time-' + randomId() + '-' + st.trip_id,
	calendar: s => 'service-' + s.service_id,
	calendar_dates: e => 'calendar_date-' + randomId() + '-' + e.service_id
}

const dbToData = {
	agency: (agencyId) => 'agency-' + (agencyId || ''),
	stops: (stopId) => 'stop-' (stopId || ''),
	routes: routeId => 'route-' + (routeId || ''),
	trips: (routeId, tripId) => {
		return 'trip-'
		+ (routeId ? routeId + '-' : '')
		+ (tripId ? tripId : '')
	},
	stop_times: (stopTimeId, tripId) => {
		return 'stop_time-'
		+ (stopTimeId ? stopTimeId + '-' : '')
		+ (tripId ? tripId : '')
	},
	calendar: serviceId => 'service-' + (serviceId || ''),
	calendar_dates: (excId, serviceId) => {
		return 'calendar_date-'
		+ (excId ? excId + '-' : '')
		+ (serviceId ? serviceId : '')
	}
}

module.exports = {dataToDb, dbToData}
