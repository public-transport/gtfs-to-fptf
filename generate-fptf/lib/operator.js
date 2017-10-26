'use strict'

const toString = require('lodash.tostring')

const createOperator = (agency) => ({
    type: 'operator',
    id: toString(agency.agency_id),
    name: toString(agency.agency_name),
    url: toString(agency.agency_url) || null,
    store: toString(agency.fare_url) || null,
    timezone: toString(agency.agency_timezone) || null,
    language: toString(agency.agency_lang) || null,
    phone: toString(agency.agency_phone) || null,
    email: toString(agency.agency_email) || null
})

module.exports = createOperator
