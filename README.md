
# modella-mongo-oplog

Real-time model updates with MongoDB.


## Install

With [npm(1)](https://www.npmjs.org):

```
$ npm install modella-mongo-oplog
```

You'll need to [enable replication on your MongoDB server](http://docs.mongodb.org/manual/tutorial/convert-standalone-to-replica-set/).


## Example

Check the /example folder for an express app that pushes model changes 
to the browser in real time using EventSource.


## Usage

```js
var model = require('modella')
var mongo = require('modella-mongo')
var oplog = require('modella-mongo-oplog')

var User = model('User')
  .use(mongo('localhost/test'))
  .use(oplog('localhost/local', 'test'))
  .attr('name')
  // ...
```


## API

### Model#subscribe()

Subscribe a model instance. The model will now emit `change`, 
`change ATTR`, and `remove` events whenever it changes on the database.

### Model#unsubscribe()

Remove a model instance from subscription.
