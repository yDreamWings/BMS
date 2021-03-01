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
 * 读者表结构
 */
const Schema = mongoose.Schema;

let readerSchema = new Schema({
  rid: {
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
  bbooks: [
    {
      bid: {
        type: Number
      },
      bookname: {
        type: String
      },
      tlimit: {
        type: String
      }
    }
  ],
  credit: {
    type: Number,
    required: true,
    default: 5
  },
  password: {
    type: String,
    required: true
  },
  root: {
    type: Boolean,
    default: false
  },
  email: {
    type: String
  },
  phone: {
    type: String
  }
});

let Reader = mongoose.model('Reader',readerSchema);

module.exports = Reader;