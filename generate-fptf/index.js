'use strict'

const map = require('through2-map').obj
const filter = require('through2-filter').obj
const sortBy = require('lodash.sortby')
const toString = require('lodash.tostring')
const toNumber = require('lodash.tonumber')
const toArray = require('lodash.toarray')
const toStream = require('into-stream').obj

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
    gtfsTrips.on('data', (gtfsTrip) => {
        // todo: check if drop_off_type == 1
        gtfs.tripStopTimes(gtfsTrip.trip_id).then((stopTimes) => {
            stopTimes = sortBy(stopTimes, (x) => toNumber(x.stop_sequence))

            // ROUTES AND LINES
            const stops = stopTimes.map((x) => toString(x.stop_id))
            const hash = JSON.stringify({line: gtfsTrip.route_id, stops})
            // create route
            if(!routeCollection[hash])
                routeCollection[hash] = createRoute(gtfsTrip, stops)
            // save route <-> trip relation
            tripToRoute[gtfsTrip.trip_id] = routeCollection[hash].id


            // SCHEDULES
            Promise.all([gtfs.service(gtfsTrip.service_id), gtfs.serviceCalendarDates(gtfsTrip.service_id)])
            .then(([service, calendarDates]) => {
                const dates = helpers.expandToDates(service, calendarDates)
                const sequence = helpers.createSequence(stopTimes)
                const firstDeparture = stopTimes[0].departure_time

                helpers.getTimezone(gtfsTrip, gtfs)
                .then((timezone) => helpers.generateStartPoints(firstDeparture, dates, timezone))
                .then((starts) => {
                    schedules.write(createSchedule(gtfsTrip, starts, sequence))
                })
            })
        })
    })
    gtfsTrips.on('end', () => {
        // write routes
        const routeList = toArray(routeCollection)
        toStream(routeList).pipe(routes)

        // todo: nest routes in lines?
        // write lines
        const routesPerLine = helpers.groupRoutesByLine(routeList)
        gtfs.routesStream().pipe(map(createLine(routesPerLine))).pipe(lines)
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
