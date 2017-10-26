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

const dataToOp = (type, hasID = true, specialID = false) => (element) => ({
	key: type + '-' + (specialID ? element[specialID]+'-' : '') + (hasID ? element[type + '_id'] : id()),
	value: element
})

const main = (gtfs) => {
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

	const streams = []

	streams.push(gtfs.agency.pipe(parser()).pipe(map(dataToOp('agency'))).pipe(db.createWriteStream()))
	streams.push(gtfs.stops.pipe(parser()).pipe(map(dataToOp('stop'))).pipe(db.createWriteStream()))
	streams.push(gtfs.routes.pipe(parser()).pipe(map(dataToOp('route'))).pipe(db.createWriteStream()))
	streams.push(gtfs.trips.pipe(parser()).pipe(map(dataToOp('trip', true, 'route_id'))).pipe(db.createWriteStream()))
	streams.push(gtfs.stop_times.pipe(parser()).pipe(map(dataToOp('stop_time', false, 'trip_id'))).pipe(db.createWriteStream()))
	if(gtfs.calendar) streams.push(gtfs.calendar.pipe(parser()).pipe(map(dataToOp('service'))).pipe(db.createWriteStream()))
	if(gtfs.calendar_dates) streams.push(gtfs.calendar_dates.pipe(parser()).pipe(map(dataToOp('calendar_date', false,  'service_id'))).pipe(db.createWriteStream()))

	return Promise.all(streams.map(toPromise))
	.then(() => db)
}

module.exports = main
