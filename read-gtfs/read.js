'use strict'

const fs = require('fs')
const path = require('path')

const readStream = (dir, file) => fs.createReadStream(path.join(dir, file))

const readGTFS = (dir) => {
	return {
		agency: readStream(dir, 'agency.txt'),
		stops: readStream(dir, 'stops.txt'),
		routes: readStream(dir, 'routes.txt'),
		trips: readStream(dir, 'trips.txt'),
		stop_times: readStream(dir, 'stop_times.txt'),
		calendar: readStream(dir, 'calendar.txt'),
		calendar_dates: readStream(dir, 'calendar_dates.txt'),
		// todo: fare_attributes, fare_rules, shapes, frequencies, transfers, feed_info
	}
}

module.exports = readGTFS
