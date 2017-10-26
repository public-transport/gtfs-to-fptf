'use strict'

const gtfs = require('./read-gtfs')
const fptf = require('./generate-fptf')

const main = (gtfsStreams) => gtfs.fromStreams(gtfsStreams).then(fptf)
const fromDB = (levelDB) => gtfs.fromDB(levelDB).then(fptf)

module.exports = main
module.exports.fromDB = fromDB
