'use strict'

const csv = require('fast-csv')
const level = require('level')
const levelWriteStream = require('level-writestream')
const tmp = require('tmp')
const map = require('through2-map').obj
const id = require('unique-string')
const toPromise = require('stream-to-promise')

// cleanup even on errors
tmp.setGracefulCleanup()

const parser = () => csv({headers: true})

const prepare = (type, hasID = true, specialID = false) => (element) => ({
	key: type + '-' + (specialID ? element[specialID]+'-' : '') + (hasID ? element[type + '_id'] : id()),
	value: element
})

const main = (gtfs) => {
	// todo: additional file checks
	if(!gtfs.calendar && !gtfs.calendar_dates){
		throw new Error('missing `calendar` or `calendar_dates`, at least one must exist.')
	}
	const tempDir = tmp.dirSync({prefix: 'read-GTFS-'})
	console.warn(`database written to ${tempDir.name}`)
	const db = level(tempDir.name, {
		valueEncoding: 'json'
	})
	levelWriteStream(db)

	const writeStreams = []

	writeStreams.push(gtfs.agency.pipe(parser()).pipe(map(prepare('agency'))).pipe(db.createWriteStream()))
	writeStreams.push(gtfs.stops.pipe(parser()).pipe(map(prepare('stop'))).pipe(db.createWriteStream()))
	writeStreams.push(gtfs.routes.pipe(parser()).pipe(map(prepare('route'))).pipe(db.createWriteStream()))
	writeStreams.push(gtfs.trips.pipe(parser()).pipe(map(prepare('trip', true, 'route_id'))).pipe(db.createWriteStream()))
	writeStreams.push(gtfs.stop_times.pipe(parser()).pipe(map(prepare('stop_time', false, 'trip_id'))).pipe(db.createWriteStream()))
	if(gtfs.calendar) writeStreams.push(gtfs.calendar.pipe(parser()).pipe(map(prepare('service'))).pipe(db.createWriteStream()))
	if(gtfs.calendar_dates) writeStreams.push(gtfs.calendar_dates.pipe(parser()).pipe(map(prepare('calendar_date', false,  'service_id'))).pipe(db.createWriteStream()))

	return Promise.all(writeStreams.map(toPromise))
	.then(() => db).catch(console.error)
}

module.exports = main
