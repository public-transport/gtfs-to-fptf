'use strict'

const pify = require('pify')
const level = require('level')
const tmp = require('tmp')

const importGTFS = require('gtfs-to-leveldb')
const createReader = require('gtfs-to-leveldb/reader')
const generateFPTF = require('./generate-fptf')

tmp.setGracefulCleanup() // clean up even on errors

const pLevel = pify(level)
const pTmpDir = pify(tmp.dir)

const convert = async (srcDir, workDir) => {
	if (!workDir) workDir = await pTmpDir({prefix: 'read-GTFS-'})

	const db = await pLevel(workDir, {valueEncoding: 'json'})
	await importGTFS(srcDir, db)

	return generateFPTF(createReader(db))
	// todo: remove tmp dir
}

module.exports = convert
