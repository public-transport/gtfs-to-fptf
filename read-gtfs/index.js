'use strict'

const toPromise = require('get-stream')

const importToDB = require('./import')

const raeudig = "\xff"

const selectEntry = (db, type) => (id) => db.get(type + '-' + id)
const selectEntriesStream = (db, type) => () => db.createValueStream({
    gte: type + '-',
    lte: type + '-' + raeudig
})
const selectEntriesPromise = (db, type) => () => toPromise.array(selectEntriesStream(db, type)())

const secondLevelEntries = (db, type) => (id) => toPromise.array(db.createValueStream({
    gte: type + '-' + id + '-',
    lte: type + '-' + id + '-' + raeudig
}))

const main = (db) => ({
    agency: selectEntry(db, 'agency'),
    agencies: selectEntriesPromise(db, 'agency'),
    agencyStream: selectEntriesStream(db, 'agency'),
    stop: selectEntry(db, 'stop'),
    stops: selectEntriesPromise(db, 'stop'),
    stopStream: selectEntriesStream(db, 'stop'),
    route: selectEntry(db, 'route'),
    routes: selectEntriesPromise(db, 'route'),
    routeStream: selectEntriesStream(db, 'route'),
    routeTrips: secondLevelEntries(db, 'trip'),
    trips: selectEntriesPromise(db, 'trip'),
    tripStream: selectEntriesStream(db, 'trip'),
    tripStopTimes: secondLevelEntries(db, 'stop_time'),
    service: (id) => selectEntry(db, 'service')(id).catch(() => null),
    serviceCalendarDates: secondLevelEntries(db, 'calendar_date'),
})

const fromStreams = (streams) => importToDB(streams).then(main)

module.exports = {
    fromDB: main,
    fromStreams
}
