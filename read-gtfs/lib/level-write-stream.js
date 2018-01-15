'use strict'

const {Writable} = require('stream')

const levelWriteStream = (db, batchSize = 100) => {
	let batch = []
	let batchI = 0

	const write = (op, _, cb) => {
		batch[batchI] = {type: 'put', key: op.key, value: op.value}
		batchI++

		if (batchI >= batchSize) {
			db.batch(batch, cb)
			batch = []
			batchI = 0
		} else cb()
	}

	const final = (cb) => {
		db.batch(batch, cb)
	}

	return new Writable({objectMode: true, write, final})
}

module.exports = levelWriteStream
