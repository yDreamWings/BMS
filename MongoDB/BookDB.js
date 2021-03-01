const mongoose = require('mongoose')

/**
 * 连接数据库
 */
mongoose.connect('mongodb://localhost/lms');
const db = mongoose.connection;
db.on('error',console.error.bind(console, 'connection error:'))
db.once('open',function(){
  console.log('lms is ok')
})

/**
 * 图书表结构
 */
const Schema = mongoose.Schema;
let bookSchema = new Schema({
  bookname: {
    type: String,
    required: true
  },
	bid: {
    type: Number,
    required: true
  },
	pdate: {
    type: String,
    required: true
  },
	author: {
    type: String,
    required: true
  },
	press: {
    type: String,
    required: true
  },
	bcount:{
    type: Number,
    required: true,
    default: 0
	},
	status: {
    type: Boolean,
    required: true,
    default: false
  },
  borrowid: {
    type: Number
  },
  price: {
    type: String,
    required: true
  },
  loaction: {
    floor: {
      type: Number,
      required: true,
      default: 0
    },
    code: {
      type: String,
      required: true,
      default: 0
    },
    row: {
      type: Number,
      required: true,
      default: 0
    }
  },
  bdate: {
    type: Number,
    default: null
  },
  category: {
		maincate: {
      type: String,
      required: true
    },
    childcate: {
      type: String
    }
	}
});

let Book = mongoose.model('Book', bookSchema);

module.exports = Book;