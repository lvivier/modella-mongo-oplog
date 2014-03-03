
/**
 * Dependencies
 */
var clone = require('component-clone')
var debug = require('debug')('oplog')
var query = require('mongo-query')
var oplog = require('oplog')
var monk = require('monk')


/**
 * Subscribed models
 */

var models = {}


/**
 * Add oplog subscription to models
 */

module.exports = function (dsn, db) {
  // TODO pick monk instance off modella-mongo
  var conn = monk(dsn)
  var log = oplog(conn)
  log.tail()

  return function (Model) {
    // filter namespace
    var ns = db+'.'+Model.modelName

    // create filter for this collection
    log
      .filter()
      .ns(ns)
      .on('update', update)
      .on('remove', remove)

    // add subscribe method
    Model.prototype.subscribe = function () {
      sub(this)
      this.emit('subscribe')
      return this
    }

    // add unsubscribe method
    Model.prototype.unsubscribe = function () {
      unsub(this)
      this.emit('unsubscribe')
      return this
    }

    return Model
  }
  
}

function sub (model) {
  var id = model.primary()
  if (!models[id]) models[id] = []
  models[id].push(model)
  debug('subscribe id %s', id)
}

function unsub (model) {
  var id = model.primary()
  // if (models[id].length) 
  debug('unsubscribe id %s', id)
}


/**
 * Model updated on db
 */

function update (ch) {
  var id = ch.o2._id
  var arr = models[id]

  // is subscribed model?
  if (!arr) return

  // clone attribs
  var obj = clone(arr[0].attrs)
  debug('update %s', id)

  // update
  // TODO only attrs that belong to model
  query(obj, {}, ch.o)

  arr.forEach(function (model) {
    model.set(obj)
  })
}


/**
 * Model removed from db
 */

function remove (ch) {
  var id = ch.o._id
  var arr = models[id]

  if (!arr) return

  debug('remove %s', id)

  arr.forEach(function (model) {
    model.removed = true
    model.emit('remove')
  })
  arr = undefined
}
