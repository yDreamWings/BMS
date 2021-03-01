const mongoose = require('mongoose')

/**
 * 连接数据库
 */
mongoose.connect('mongodb://localhost/lms')
const db = mongoose.connection;
db.on('error',console.error.bind(console, 'connection error:'))
db.once('open',function(){
  console.log('lms is ok')
})


/**
 * 管理员表结构
 */
const Schema = mongoose.Schema;

let mangementSchema = new Schema({
  mid: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sex: {
    type: String,
    required: true
  },
  unit: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  root: {
    type: Boolean,
    default: true
  },
  email: {
    type: String
  },
  phone: {
    type: String
  }
});

let Mangement = mongoose.model('Mangement',mangementSchema);

module.exports = Mangement;
