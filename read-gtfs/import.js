'use strict'

const parseCsv = require('fast-csv')
const levelWriteStream = require('level-writestream')
const map = require('through2-map').obj
const pump = require('pump')

const {dataToDb} = require('./mapping')

const importIntoDB = (gtfs, db) => {
	// todo: additional file checks
	if(!gtfs.calendar && !gtfs.calendar_dates){
		throw new Error('missing `calendar` or `calendar_dates`, at least one must exist.')
	}

	levelWriteStream(db) // todo: stop monkey-patching db

	const tasks = [
		{input: gtfs.agency, key: dataToDb.agency},
		{input: gtfs.stops, key: dataToDb.stops},
		{input: gtfs.routes, key: dataToDb.routes},
		{input: gtfs.trips, key: dataToDb.trips},
		{input: gtfs.stop_times, key: dataToDb.stop_times}
	]
	if (gtfs.calendar) {
		tasks.push({input: gtfs.calendar, key: dataToDb.calendar})
	}
	if (gtfs.calendar_dates) {
		tasks.push({input: gtfs.calendar_dates, key: dataToDb.calendar_dates})
	}

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
}

module.exports = importIntoDB
