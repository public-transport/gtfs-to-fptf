'use strict'

const toNumber = require('lodash.tonumber')
const uniq = require('lodash.uniq')
const union = require('lodash.union')
const filter = require('lodash.filter')

const moment = require('moment-timezone')
const momentDurationFormatPlugin = require('moment-duration-format')

momentDurationFormatPlugin(moment)

const toSeconds = (timeString) => moment.duration(timeString).asSeconds()

const groupRoutesByLine = (routes) => {
    const routesPerLine = {}
    for(let route of routes){
        if(!routesPerLine[route.line]) routesPerLine[route.line] = []
        routesPerLine[route.line].push(route.id)
    }
    return routesPerLine
}

const expandToDates = (service, calendarDates) => {
    let dates = []

    // collect data from calendar
    if(service){
        if(!service.start_date || !service.end_date){
            throw new Error('missing `start_date` or `end_date`.')
        }
        const start = moment(service.start_date, 'YYYYMMDD').startOf('day')
        const end = moment(service.end_date, 'YYYYMMDD').startOf('day')

        let date = moment(start)
        while(+date <= +end){
            const weekday = date.format('dddd').toLowerCase()
            if(toNumber(service[weekday]) === 1) dates.push(date.format('YYYYMMDD'))
            date = date.add(1, 'days').startOf('day')
        }
    }

    // collect calendarDates
    for(let row of calendarDates || []){
        const exceptionType = toNumber(row.exception_type)
        // add service for this date
        if(exceptionType === 1) dates = uniq(union(dates, [row.date]))
        // remove/disable service date
        if(exceptionType === 2) dates = filter(dates, (x) => x !== row.date)
    }
    return dates
}

const createSequence = (tripStopTimes) => {
    // todo: other stop_times keys
    if(tripStopTimes.length === 0){
        throw new Error('`trip` must have more than 0 `stop_times`')
    }
    const startReference = toSeconds(tripStopTimes[0].departure_time)
    const sequence = tripStopTimes.map((tripStopTime) => ({
        arrival: toSeconds(tripStopTime.arrival_time) - startReference,
        departure: toSeconds(tripStopTime.departure_time) - startReference
    }))

    return sequence
}

const getTimezone = (trip, model) =>
    model.stop(trip.stop_id)
    .then((stop) => {
        if(stop.stop_timezone) return timezone
        if(stop.parent_station) return model.stop(stop.parent_station)
        .then((station) => {
            if(station.stop_timezone) return timezone
            throw new Error('missing timezone')
        })
        throw new Error('missing timezone')
    })
    .catch((error) =>
        model.route(trip.route_id).then((route) => route.agency_id ? model.agency(route.agency_id) : null)
        .then((agency) => {
            if(agency && agency.agency_timezone) return agency.agency_timezone
            throw new Error('missing timezone')
        })
    )

    const generateStartPoints = (time, dates, timezone) =>
        // todo: time > 24:00:00 ?
        dates.map((date) => +moment.tz(`${date} ${time}`, 'YYYYMMDD HH:mm:ss', timezone))

module.exports = {
    groupRoutesByLine,
    expandToDates,
    createSequence,
    getTimezone,
    generateStartPoints
}
