#!/usr/bin/env node --max-old-space-size=4096
'use strict'

const mri = require('mri')
const fs = require('fs')
const path = require('path')
const ndjson = require('ndjson')
const toPromise = require('stream-to-promise')
const isEmpty = require('is-empty-file')

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

const files = ['agency', 'stops', 'routes', 'trips', 'stop_times', 'calendar', 'calendar_dates']

const main = (opt) => {
	const source = path.resolve(opt.source)
	const destination = path.resolve(opt.destination)

	const gtfs = {}
	for(let file of files){
		const filePath = path.join(source, file + '.txt')
		if(!fs.existsSync(filePath)){
			if(['calendar', 'calendar_dates'].includes(file)){
				gtfs[file] = null
			}
			else{
				throw new Error(`file not found: '${file}.txt'`)
			}
		}
		else{
			fs.accessSync(filePath, fs.constants.R_OK)
			gtfs[file] = fs.createReadStream(filePath)
		}
	}

	toFPTF(gtfs)
	.then((fptf) => {
		if(!fs.existsSync(destination)) fs.mkdirSync(destination)
		fs.accessSync(destination, fs.constants.W_OK)

		const streams = []

		for(let file in fptf){
			const filePath = path.join(destination, file + '.ndjson')
			streams.push(fptf[file].pipe(ndjson.stringify()).pipe(fs.createWriteStream(filePath)))
		}

		Promise.all(streams.map(toPromise))
		.then((done) => {
			let i = 0
			for(let file in fptf){
				const filePath = path.join(destination, file + '.ndjson')
				if(isEmpty(filePath)){
					fs.unlinkSync(filePath)
					i++
				}
			}
			console.log(`${files.length - i} files written`)
		})
		.catch((error) => {
			console.error(error)
			throw new Error(error)
		})
	})
	.catch((error) => {
		console.error(error)
		throw new Error(error)
	})
}

main(opt)
