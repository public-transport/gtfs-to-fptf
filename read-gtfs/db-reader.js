'use strict'

const toPromise = require('get-stream')

const {dbToData} = require('./mapping')

const lastPossible = '\xff'

const single = (db, computeKey) => {
	return (...args) => db.get(computeKey(...args))
}

const range = (db, computeKey) => {
	return (secondaryId = null) => {
		const key = computeKey(secondaryId)
		return db.createValueStream({gte: key, lte: key + lastPossible})
	}
}

const pRange = (db, computeKey) => {
	const query = range(db, computeKey)
	return (secondaryId = null) => toPromise.array(query(secondaryId))
}

const createReader = (db) => ({
	agency: single(db, dbToData.agency),
	agencies: pRange(db, dbToData.agency),
	agencyStream: range(db, dbToData.agency), // todo: rename to agenciesStream

	stop: single(db, dbToData.stops),
	stops: pRange(db, dbToData.stops),
	stopStream: range(db, dbToData.stops), // todo: rename to stopsStream

	route: single(db, dbToData.routes),
	routes: pRange(db, dbToData.routes),
	routeStream: range(db, dbToData.routes), // todo: rename to routesStream

	routeTrips: pRange(db, dbToData.trips),
	trips: pRange(db, dbToData.trips),
	tripStream: range(db, dbToData.trips), // todo: rename to tripsStream

	tripStopTimes: range(db, dbToData.stop_times),

	// todo: rename these two
	service: id => single(db, dbToData.calendar)(id).catch(() => null),
	serviceCalendarDates: range(db, dbToData.calendar_dates)
})

module.exports = createReader
