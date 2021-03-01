const express = require('express')
const bodyParser = require('body-parser')
const expressJwt = require('express-jwt')
const router = require('./router/router')
const jwtValue = require('./jwt')

const app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, X_Requested_With')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  if (req.method == 'OPTIONS') res.send(200)
  else next()
})

app.use(expressJwt({
    secret: jwtValue.PRIVITE_KEY,
    algorithms: ['HS256']
}).unless({
  path: ['/login']
}))

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {   
    res.status(401).send('invalid token')
  }
})

app.use(router)

app.listen(8000,()=>{
  console.log('server is ok...')
})