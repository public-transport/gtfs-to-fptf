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

const convert = async (srcDir, workDir) => {
	if (!workDir) workDir = await pTmpDir({prefix: 'read-GTFS-'})

	const gtfsStreams = readGTFS(srcDir)
	const db = await pLevel(workDir, {valueEncoding: 'json'})
	// todo: what if the data has already been imported?
	await importGTFS(gtfsStreams, db)

	yield generateFPTF(dbReader(db))
	// todo: remove tmp dir
}

module.exports = convert
