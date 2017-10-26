'use strict'

const parseCsv = require('fast-csv')
const level = require('level')
const levelWriteStream = require('level-writestream')
const tmp = require('tmp')
const map = require('through2-map').obj
const randomId = require('unique-string')
const pump = require('pump')

// cleanup even on errors
tmp.setGracefulCleanup()

const importIntoDB = (gtfs) => {
	// todo: additional file checks
	if(!gtfs.calendar && !gtfs.calendar_dates){
		throw new Error('missing `calendar` or `calendar_dates`, at least one must exist.')
	}
	const tempDir = tmp.dirSync({prefix: 'read-GTFS-'})
	console.warn(`database written to ${tempDir.name}`) // todo: remove logging, expose path
	const db = level(tempDir.name, {
		valueEncoding: 'json'
	})
	levelWriteStream(db)

	const tasks = [
		{input: gtfs.agency, key: a => 'agency-' + a.agency_id},
		{input: gtfs.stops, key: s => 'stop-' + s.stop_id},
		{input: gtfs.routes, key: r => 'route-' + r.route_id},
		{input: gtfs.trips, key: t => 'trip-' + t.route_id + '-' + t.trip_id},
		{input: gtfs.stop_times, key: st => 'stop_time-' + randomId() + '-' + st.trip_id}
	]
	if (gtfs.calendar) tasks.push({
		input: gtfs.calendar,
		key: s => 'service-' + s.service_id
	})
	if (gtfs.calendar_dates) tasks.push({
		input: gtfs.calendar_dates,
		key: e => 'calendar_date-' + randomId() + '-' + e.service_id
	})

	const processTask = (task) => new Promise((resolve, reject) => {
		const dataToOp = (data) => ({
			key: task.key(data),
			value: data
		})

		pump(
			parseCsv({headers: true}), // parse
			map(dataToOp), // convert
			db.createWriteStream(), // store
			(err) => {
				if (err) reject(err)
				else resolve()
			}
		)
	})

	return Promise.all(tasks.map(processTask))
	.then(() => db)
}

module.exports = importIntoDB
