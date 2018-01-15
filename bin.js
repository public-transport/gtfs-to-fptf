#!/usr/bin/env node --max-old-space-size=4096
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

const opt = {
    source: argv._[0],
    destination: argv._[1],
    help: argv.help || argv.h,
    version: argv.version || argv.v
}

if (opt.help === true) {
	process.stdout.write(`
gtfs-to-fptf [options] gtfs-directory fptf-directory

Arguments:
    gtfs-directory       Input directory containing GTFS textfiles.
    fptf-directory       Output directory where the FPTF files will be created.

Options:
    --help       -h  Show this help message.
    --version    -v  Show the version number.

`)
	process.exit(0)
}

if (opt.version === true) {
	process.stdout.write(`${pkg.version}\n`)
	process.exit(0)
}

// main program

const pPump = pify(pump)
const pIsEmptyFile = pify(isEmptyFile)

const main = async (opt) => {
	const sourceDir = path.resolve(opt.source)
	const destDir = path.resolve(opt.destination)
	await fse.ensureDir(destDir)

	const fptf = await toFPTF(sourceDir)
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

main(opt)
.catch((err) => {
	console.error(err)
	process.exitCode = 1
})
