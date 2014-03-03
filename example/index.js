
var express = require('express')
var oplog = require('..')('localhost/local', 'test')
var mongo = require('modella-mongo')('localhost/test')
var model = require('modella')

var Timer = model('Timer')
  .use(mongo)
  .use(oplog)
  .attr('_id')
  .attr('time')
  .attr('name')

var timer = new Timer({name:'Example', time:Date.now()})
timer.save()

// update every two seconds
setInterval(function(){
  timer
    .time(Date.now())
    .save()
}, 2000)

express()
  .get('/subscribe', subscribe)
  .get('/', index)
  .listen(3000)

function index (req, res) {
  res.render(__dirname+'/index.jade')
}

function subscribe (req, res) {
  Timer.find(timer.primary(), done)

  function done (err, timer) {
    if (err) throw err

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    res.write('id: '+Date.now()+'\n')
    res.write('event: init\n')
    res.write('data: '+JSON.stringify(timer.attrs)+'\n\n')

    timer
      .subscribe()
      .on('change time', function () {
        res.write('id: '+Date.now()+'\n')
        res.write('event: change\n')
        res.write('data: '+JSON.stringify(timer.attrs)+'\n\n')
      })
  }
}
