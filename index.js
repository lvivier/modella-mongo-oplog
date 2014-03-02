
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

module.exports = function subscribe (dsn, db) {
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
      var id = this.primary()
      models[id] = this
      debug('subscribe id %s', id)
      this.emit('subscribe')
      return this
    }

    // add unsubscribe method
    Model.prototype.unsubscribe = function () {
      var id = this.primary()
      models[id] = undefined
      debug('unsubscribe id %s', id)
      this.emit('unsubscribe')
      return this
    }

    return Model
  }
  
}


/**
 * Model updated on db
 */

function update (ch) {
  var id = ch.o2._id
  var model = models[id]

  // is subscribed model?
  if (!model) return

  // clone attribs
  var obj = clone(model.attrs)
  debug('update %s', id)

  // update
  // TODO only attrs that belong to model
  query(obj, {}, ch.o)
  model.set(obj)
}


/**
 * Model removed from db
 */

function remove (ch) {
  var id = ch.o._id
  var model = models[id]

  if (!model) return

  debug('remove %s', id)

  model.removed = true
  model.emit('remove')
}
