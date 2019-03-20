#!/usr/bin/env node
'use strict'

const mri = require('mri')
const fse = require('fs-extra')
const path = require('path')
const pify = require('pify')
const pump = require('pump')
const ndjson = require('ndjson')
const isEmptyFile = require('is-empty-file')

const toFPTF = require('./index')
const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: ['help', 'h', 'version', 'v']
})

if (argv.help === true || argv.h === true) {
	process.stdout.write(`
gtfs-to-fptf [options] gtfs-directory fptf-directory

Arguments:
	gtfs-directory       Input directory containing GTFS textfiles.
	fptf-directory       Output directory where the FPTF files will be created.

Options:
	--tmp-dir    -t  Directory to store intermediate files. Default: unique tmp dir
	--help       -h  Show this help message.
	--version    -v  Show the version number.

`)
	process.exit(0)
}

if (argv.version === true || argv.v === true) {
	process.stdout.write(`${pkg.version}\n`)
	process.exit(0)
}

// main program

const config = {
	source: argv._[0],
	destination: argv._[1],
	tmpDir: argv['tmp-dir'] || argv.t || null
}

const pPump = pify(pump)
const pIsEmptyFile = pify(isEmptyFile, { errorFirst: false })

const main = async () => {
	const sourceDir = path.resolve(config.source)
	const destDir = path.resolve(config.destination)
	await fse.ensureDir(destDir)

	const fptf = await toFPTF(sourceDir, config.tmpDir)
	const tasks = []

	for (let file in fptf) {
		const dest = path.join(destDir, file + '.ndjson')
		tasks.push(pPump(
			fptf[file],
			ndjson.stringify(),
			fse.createWriteStream(dest)
		))
	}

	await Promise.all(tasks)

	let filesWritten = 0
	for (let file in fptf) {
		const dest = path.join(destDir, file + '.ndjson')
		if (await pIsEmptyFile(dest)) await fse.remove(dest)
		else filesWritten++
	}
	console.info(`${filesWritten} files written`)
}

main()
	.catch((err) => {
		console.error(err)
		process.exitCode = 1
	})
