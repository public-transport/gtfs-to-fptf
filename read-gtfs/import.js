'use strict'

const parseCsv = require('fast-csv')
const level = require('level')
const levelWriteStream = require('level-writestream')
const tmp = require('tmp')
const map = require('through2-map').obj
const pump = require('pump')

// cleanup even on errors
tmp.setGracefulCleanup()

const {dataToDb} = require('./mapping')

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
	.then(() => db)
}

module.exports = importIntoDB
