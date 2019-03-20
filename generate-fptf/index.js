'use strict'

const map = require('through2-map').obj
const filter = require('through2-filter').obj
const sortBy = require('lodash/sortBy')
const toString = require('lodash/toString')
const toNumber = require('lodash/toNumber')
const toArray = require('lodash/toArray')
const toStream = require('into-stream').obj
const { lineString } = require('@turf/helpers')

const stream = () => map((x) => x)

const helpers = require('./lib/helpers')
const createOperator = require('./lib/operator')
const createStopOrStation = require('./lib/stopOrStation')
const createRoute = require('./lib/route')
const createLine = require('./lib/line')
const createSchedule = require('./lib/schedule')

const main = (gtfs) => {
	// write operators
	const operators = gtfs.agenciesStream().pipe(map(createOperator))

	// write stations and stops
	const stopsAndStations = gtfs.stopsStream().pipe(map(createStopOrStation))
	const stations = stopsAndStations.pipe(filter((x) => x.type === 'station'))
	const stops = stopsAndStations.pipe(filter((x) => x.type === 'stop'))

	// write routes, lines and schedules
	const routes = stream()
	const lines = stream()
	const schedules = stream()
	const routeCollection = {}
	const tripToRoute = {}
	const gtfsTrips = gtfs.tripsStream()

	const reading = []

	gtfsTrips.on('data', (gtfsTrip) => {
		reading.push((async () => {
			let _stopTimes
			try {
				_stopTimes = await gtfs.tripStopovers(gtfsTrip.trip_id)
			} catch (error) {
				return console.error(`Skipping entries for trip "${gtfsTrip.trip_id}", not found in database!`)
			}
			// todo: check if drop_off_type == 1
			const stopTimes = sortBy(_stopTimes, (x) => toNumber(x.stop_sequence))

			// ROUTES AND LINES
			const stops = stopTimes.map((x) => toString(x.stop_id))
			const hash = JSON.stringify({ line: gtfsTrip.route_id, stops })
			// create route
			if (!routeCollection[hash]) {
				let polyline
				try {
					if (gtfsTrip.shape_id) {
						// eslint-disable-next-line handle-callback-err
						const shapes = await (gtfs.shapes(gtfsTrip.shape_id).catch((error) => undefined))
						if (Array.isArray(shapes) && shapes.length >= 2) {
							const sorted = sortBy(shapes, shape => +shape.shape_pt_sequence)
							const points = sorted.map(shape => [+shape.shape_pt_lon, +shape.shape_pt_lat])
							polyline = lineString(points)
						}
					}
				} catch (error) {
					console.error(`Skipping shapes for trip "${gtfsTrip.trip_id}", error!`)
				}
				routeCollection[hash] = createRoute(gtfsTrip, stops, polyline)
			}
			// save route <-> trip relation
			tripToRoute[gtfsTrip.trip_id] = routeCollection[hash].id

			// SCHEDULES
			let service, calendarDates
			try {
				[service, calendarDates] = await Promise.all([gtfs.service(gtfsTrip.service_id), gtfs.serviceExceptions(gtfsTrip.service_id)])
			} catch (error) {
				return console.error(`Skipping entries for service "${gtfsTrip.service_id}", not found in database!`)
			}
			const dates = helpers.expandToDates(service, calendarDates)
			const sequence = helpers.createSequence(stopTimes)
			const firstDeparture = stopTimes[0].departure_time

			let starts
			try {
				const timezone = await helpers.getTimezone(gtfsTrip, gtfs)
				starts = await helpers.generateStartPoints(firstDeparture, dates, timezone)
			} catch (error) {
				console.error(`Unable to fetch timezone for trip "${gtfsTrip.trip_id}"!`)
			}
			schedules.write(createSchedule(gtfsTrip, starts, sequence))
		})())
	})
	gtfsTrips.on('end', () => {
		Promise.all(reading).then(() => {
			// write routes
			const routeList = toArray(routeCollection)
			toStream(routeList).pipe(routes)

			// todo: nest routes in lines?
			// write lines
			const routesPerLine = helpers.groupRoutesByLine(routeList)
			gtfs.routesStream().pipe(map(createLine(routesPerLine))).pipe(lines)

			schedules.end() // todo
		})
	})

	return {
		operators,
		stops,
		stations,
		lines,
		routes,
		schedules
	}
}

module.exports = main
