# gtfs-to-fptf

Convert [GTFS](https://developers.google.com/transit/gtfs/) data to [FPTF](https://github.com/public-transport/friendly-public-transport-format): library and CLI.

*Work in progress. This software is not stable yet. See the [to-do](#to-do) section.*

[![npm version](https://img.shields.io/npm/v/gtfs-to-fptf.svg)](https://www.npmjs.com/package/gtfs-to-fptf)
[![dependency status](https://img.shields.io/david/public-transport/gtfs-to-fptf.svg)](https://david-dm.org/public-transport/gtfs-to-fptf)
[![dev dependency status](https://img.shields.io/david/dev/public-transport/gtfs-to-fptf.svg)](https://david-dm.org/public-transport/gtfs-to-fptf#info=devDependencies)
[![license](https://img.shields.io/github/license/public-transport/gtfs-to-fptf.svg?style=flat)](LICENSE)
[![chat on gitter](https://badges.gitter.im/juliuste.svg)](https://gitter.im/juliuste)

## Installation

### CLI
```shell
npm install -g gtfs-to-fptf
```

### Library

```shell
npm install --save gtfs-to-fptf
```

## Usage

### CLI

```shell
gtfs-to-fptf gtfs-directory fptf-directory
```

### Library

```js
toFPTF(gtfsDirectory, workingDirectory = null)
```

`gtfsDirectory` is the path to a directory containing `.txt` files, via the optional `workingDirectory` you can change where the scripts creates a temporary `level` db.
Returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve in an object containing FPTF object streams.

Currently, the following GTFS files are supported:

- `agency.txt` **required**
- `stops.txt` **required**
- `routes.txt` **required**
- `trips.txt` **required**
- `stop_times.txt` **required**
- `calendar.txt` *optional*, **required** if `calendar_dates.txt` is not provided
- `calendar_dates.txt` *optional*, **required** if `calendar.txt` is not provided
- `shapes.txt` **optional**

```js
const toFPTF = require('gtfs-to-fptf')

toFPTF('./bus-gtfs/')
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

## To do

- extended testing (there's probably still a lot of bugs)
- improve error handling
- dependency cleanup
- tests

## Contributing

If you found a bug, want to propose a feature or feel the urge to complain about your life, feel free to visit [the issues page](https://github.com/public-transport/gtfs-to-fptf/issues).
