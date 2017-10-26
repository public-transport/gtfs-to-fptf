# gtfs-to-fptf

Convert [GTFS](https://developers.google.com/transit/gtfs/) data to [FPTF](https://github.com/public-transport/friendly-public-transport-format): library and CLI.

*Work in progress. This software is not stable yet. See the [to-do](#to-do) section.*

[![npm version](https://img.shields.io/npm/v/gtfs-to-fptf.svg)](https://www.npmjs.com/package/gtfs-to-fptf)
[![dependency status](https://img.shields.io/david/public-transport/gtfs-to-fptf.svg)](https://david-dm.org/public-transport/gtfs-to-fptf)
[![dev dependency status](https://img.shields.io/david/dev/public-transport/gtfs-to-fptf.svg)](https://david-dm.org/public-transport/gtfs-to-fptf#info=devDependencies)
[![license](https://img.shields.io/github/license/public-transport/gtfs-to-fptf.svg?style=flat)](LICENSE)
[![chat on gitter](https://badges.gitter.im/juliuste.svg)](https://gitter.im/juliuste)

## Installation

### Library

```shell
npm install --save gtfs-to-fptf
```

### CLI
```shell
npm install -g gtfs-to-fptf
```

## Usage

### Library

The script takes an `object` containing **valid** GTFS file streams and returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve in another `object` containing FPTF object streams.

Currently, the following GTFS files are supported:

- `agency.txt` **required**
- `stops.txt` **required**
- `routes.txt` **required**
- `trips.txt` **required**
- `stop_times.txt` **required**
- `calendar.txt` *optional*, **required** if `calendar_dates.txt` is not provided
- `calendar_dates.txt` *optional*, **required** if `calendar.txt` is not provided

```js
const toFPTF = require('gtfs-to-fptf')
const fs = require('fs')


const gtfs = {
    agency: fs.createReadStream('./gtfs-dir/agency.txt'),
    stops: fs.createReadStream('./gtfs-dir/stops.txt'),
    routes: fs.createReadStream('./gtfs-dir/routes.txt'),
    trips: fs.createReadStream('./gtfs-dir/trips.txt'),
    stop_times: fs.createReadStream('./gtfs-dir/stop_times.txt'),
    calendar: fs.createReadStream('./gtfs-dir/calendar.txt'),
    calendar_dates: fs.createReadStream('./gtfs-dir/calendar_dates.txt')
}

toFPTF(gtfs)
.then((fptf) => {
    fptf.stations.pipe(someStream)
    fptf.schedules.pipe(someOtherStream)
})
```

The FPTF object contains the following streams:
- `operators`
- `stops`
- `stations`
- `lines`
- `routes`
- `schedules`

### CLI

```shell
gtfs-to-fptf gtfs-directory fptf-directory
```

## To do

- extended testing (there's probably still a lot of bugs)
- improve error handling
- outsource the GTFS library
- dependency cleanup
- tests
- publish to npm (eventually)

[@juliuste](https://github.com/juliuste) will be working on this the next few days.

## Contributing

If you found a bug, want to propose a feature or feel the urge to complain about your life, feel free to visit [the issues page](https://github.com/public-transport/gtfs-to-fptf/issues).
