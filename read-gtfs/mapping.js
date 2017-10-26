'use strict'

const randomId = require('unique-string')

const dataToDB = {
	agency: a => 'agency-' + a.agency_id,
	stops: s => 'stop-' + s.stop_id,
	routes: r => 'route-' + r.route_id,
	trips: t => 'trip-' + t.route_id + '-' + t.trip_id,
	stop_times: st => 'stop_time-' + randomId() + '-' + st.trip_id,
	calendar: s => 'service-' + s.service_id,
	calendar_dates: e => 'calendar_date-' + randomId() + '-' + e.service_id
}

const dbToData = {
	agency: agencyId => 'agency-' + agencyId,
	stops: stopId => 'stop-' + stopId,
	routes: routeId => 'route-' + routeId,
	trips: (routeId, tripId) => 'trip-' + routeId + '-' + tripId,
	stop_times: (stopTimeId, tripId) => 'stop_time-' + stopTimeId + '-' + tripId,
	calendar: serviceId => 'service-' + serviceId,
	calendar_dates: (excId, serviceId) => 'calendar_date-' + excId + '-' + serviceId
}

module.exports = {dataToDB, dbToData}
