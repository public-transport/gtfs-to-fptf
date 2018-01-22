'use strict'

const pify = require('pify')
const level = require('level')
const tmp = require('tmp')

const readGTFS = require('./read-gtfs/read')
const importGTFS = require('./read-gtfs/import')
const dbReader = require('./read-gtfs/db-reader')
const generateFPTF = require('./generate-fptf')

tmp.setGracefulCleanup() // clean up even on errors

const pLevel = pify(level)
const pTmpDir = pify(tmp.dir)

const convert = (srcDir, workDir) => {
	const p = workDir ? Promise.resolve(workDir) : pTmpDir({prefix: 'read-GTFS-'})
	const gtfsStreams = readGTFS(srcDir)

	return p
	.then((dir) => pLevel(dir, {valueEncoding: 'json'}))
	.then((db) => {
		const reader = dbReader(db)

		// todo: what if the data has already been imported?
		return importGTFS(gtfsStreams, db)
		.then(() => generateFPTF(reader))
	})
	// todo: remove tmp dir
}

module.exports = convert
