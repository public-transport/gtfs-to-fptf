'use strict'

const pify = require('pify')
const pump = require('pump')
const parseCsv = require('csv-parser')
const levelWriteStream = require('./lib/level-write-stream')
const map = require('through2-map').obj

const {dataToDb} = require('./mapping')

const pPump = pify(pump)

const importIntoDB = (gtfs, db) => {
	// todo: additional file checks
	if(!gtfs.calendar && !gtfs.calendar_dates){
		throw new Error('missing `calendar` or `calendar_dates`, at least one must exist.')
	}

	const convert = (input, mapKey) => {
		return pPump(
			input,
			parseCsv(),
			// convert to LevelDB op
			map(data => ({key: mapKey(data), value: data})),
			levelWriteStream(db) // store
		)
	}

	const tasks = [
		convert(gtfs.agency, dataToDb.agency),
		convert(gtfs.stops, dataToDb.stops),
		convert(gtfs.routes, dataToDb.routes),
		convert(gtfs.trips, dataToDb.trips),
		convert(gtfs.stop_times, dataToDb.stop_times)
	]
	if (gtfs.calendar) {
		tasks.push(convert(gtfs.calendar, dataToDb.calendar))
	}
	if (gtfs.calendar_dates) {
		tasks.push(convert(gtfs.calendar_dates, dataToDb.calendar_dates))
	}

	return Promise.all(tasks)
}

module.exports = importIntoDB
