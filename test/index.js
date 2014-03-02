
/**
 * Dependencies
 */

var mongo = require('modella-mongo')('localhost/test')
var oplog = require('..')('localhost/local', 'test')
var monk = require('monk')('localhost/test')
var model = require('modella')


/**
 * Fixture model
 */

var id
var User = model('User')
  .use(mongo)
  .use(oplog)
  .attr('_id')
  .attr('name')


/**
 * Test suite
 */

before(function (done) {
  var user = new User({name: 'Luke'})

  user.save(function (err, user) {
    if (err) return done(err)
    id = user.primary()
    done()
  })
})

describe('Model', function () {

  it('emits change', function (done) {
    User.find(id, function (err, user) {
      user
        .subscribe()
        .on('change', change)
        .on('change name', name)

      monk.get('User').update({_id: id}, {$set: {name: 'Luke Vivier'}})
    })

    var times = 0
    function change () { times++ }
    function name () { if (times) done() }
  })

  it('emits remove', function (done) {
    User.find(id, function (err, user) {
      user
        .subscribe()
        .on('remove', done)

      monk.get('User').remove({_id: id})
    })
  })

})
