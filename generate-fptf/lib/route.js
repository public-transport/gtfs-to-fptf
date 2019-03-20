'use strict'

const toString = require('lodash.tostring')

const createRoute = (trip, stops, polyline) => ({
    type: 'route',
    id: toString(trip.trip_id),
    line: toString(trip.route_id),
    stops: stops.map(toString),
    polyline
})

module.exports = createRoute
