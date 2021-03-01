const express = require('express')

const Reader = require('../MongoDB/ReaderDB')
const Mangement = require('../MongoDB/ManagementDB')
const Book = require('../MongoDB/BookDB')

const {Login} = require('../tools/login')
const {getPageData} = require('../tools/getPageData')
const {showMangement,showReader} = require('../tools/dataProcess')

const router = express.Router();

const PAGE_NUMBER = 10;
let SYSTEM_TIME;


/***************************************实时获取系统时间并每晚24点更新数据*********************************************/
let getDateInterval = setInterval(() => {
  SYSTEM_TIME = new Date();
  if(SYSTEM_TIME.getHours() == 24) {
    Book.find({status:true}, (error, bdata) => {
      let booksData = bdata; 
      if(booksData) {
        for(let item of booksData) {
          if(SYSTEM_TIME - item.bdate >= 30*24*60*60*1000) {
            Reader.findOne({rid:booksData.borrowid}, (error, rdata) => {
              let readerData = rdata;
              if(readerData) {
                let newCredit = readerData.credit == 0 ? 0 : readerData.credit - 1;
                Reader.findOneAndUpdate({rid:booksData.borrowid}, {credit:newCredit}, error => {
                  if(!error) console.log('修改成功');
                })
              }
            })
          }
        }
      }
    })
  }
}, 1000);

/*************************************发送成功信息*********************************************/
function sendMessageResolve(response, data, msg) {
  response.status(200).json({
    data,
    meta: {
      msg,
      status: 200
    }
  })
}

/*************************************发送错误信息*********************************************/
function sendMessageReject(response, msg) {
  response.status(200).json({
    data: null,
    meta: {
      msg,
      status: 400
    }
  })
}

/**
 * 登录模块
 */
/***********************************登录******************************************/
router.post('/login', (request, response, next)=>{
  if(request.body.username && request.body.password && !isNaN(parseInt(request.body.username))){
    const id = parseInt(request.body.username);
    const password = request.body.password;
    const module = request.body.module;
    if(module == 'Reader'){
      Reader.findOne({
        rid: id,
        password
      },(error, data)=>{
        Login(response, error, data, next);
      });
    }
    if(module == 'Mangement'){
      Mangement.findOne({
        mid: id,
        password
      },(error, data)=>{
        Login(response, error, data, next);
      });
    }
  }else{
    return next();
  }
})

/***********************************登录失败******************************************/
router.post('/login', (request, response, next)=>{
  sendMessageReject(response,'用户名或密码错误');
})

/**
 * 读者模块
 */
/***********************************借书******************************************/
router.post('/borrow', (request, response, next) => {
  let bid = parseInt(request.body.bid);
  let rid = parseInt(request.user.usrID);
  let bdate = new Date();
  let bcount = 0;
  let bookname = null;
  let bObj = {};
  let bbooks = [];
  if(!bid) return next();

  function findBookById(resolve,reject) {
    Book.findOne({bid:bid}, (error, data) => {
      if(error) return next();
      if(data.bcount) bcount = parseInt(data.bcount);
      bookname = data.bookname;
      bObj = {
        status: true,
        borrowid: rid,
        bdate,
        bcount: bcount + 1
      }
      resolve('ok');
    })
  }

  function findReaderById(resolve,reject) {
    Reader.findOne({rid:rid}, (error, data) => {
      if(error) return next();
      if(data.bbooks[0]) bbooks = data.bbooks;
      if(data.credit == 0) return reject();
      for(let item of bbooks) {
        if(item.bid == bid) {
          reject();
        }
      }
      if (!bbooks[0] || !bbooks[0].bid) {
        bbooks[0].bid = bid;
        bbooks[0].bookname = bookname;
        bbooks[0].tlimit = 30;
      }else{
        bbooks.push({
          bid: bid,
          bookname: bookname,
          tlimit: 30
        });
      }
      resolve('ok');
    })
  }

  function updateBook(resolve,reject) {
    Book.findOneAndUpdate({bid:bid}, bObj, error => {
      if(error) {
        reject('数据修改失败');
      }
    })
    resolve('ok');
  }

  function updateReader(resolve,reject) {
    Reader.findOneAndUpdate({rid:rid}, {bbooks:bbooks}, error => {
      if(error) {
        reject('数据修改失败');
      }
    })
    resolve('ok');
  }

  function sendMessage(resolve,reject) {
    Book.findOne({bid:bid}, (error, data) => {
      if(error) return next();
      response.status(200).json({
        data: {
          data,
          bbooks
        },
        meta: {
          msg: '数据修改成功',
          status: 200
        }
      })
    })
  }

  let promise = new Promise(findBookById)
  .then(value => {
    return new Promise(findReaderById)
  })
  .then(value => {
    return new Promise(updateBook)
  })
  .then(value => {
    return new Promise(updateReader)
  })
  .then(value => {
    sendMessage();
  })
  .catch(error => {
    sendMessageReject(response,'数据修改失败')
  })
})
 
/**
 * 管理员模块
 */
/***********************************查看读者信息******************************************/
router.post('/reader', (request, response, next)=>{
  let rid = request.body.rid;
  let getReader = {};
  Reader.findOne({rid:rid}, (error, data) => {
    if(error) return next();
    getReader = {
      rid: data.rid,
      email: data.email,
      phone: data.phone,
      name: data.name,
      sex: data.sex
    }
    sendMessageResolve(response, getReader, '数据获取成功')
  })
})

/***********************************挂失******************************************/
router.post('/loss', (request, response, next)=>{
  if(!request.user.root) return sendMessageReject(response, '权限不足');
  let bid = parseInt(request.body.bid);
  let rid = null;
  let newBbooks = [];
  let bdate = new Date();
  let bObj = {
    status: true,
    borrowid: 0,
    bdate: bdate
  };

  function findBookById(resolve, reject) {
    Book.findOne({bid:bid}, (error, data) => {
      if(error) return next();
      rid = data.borrowid;
      resolve();
    })
  }

  function findReaderById(resolve, reject) {
    Reader.findOne({rid:rid}, (error, data) => {
      if(error) return next();
      if(!data.bbooks[0].bid) return next();
      newBbooks = data.bbooks;
      for(let index in newBbooks) {
        if(newBbooks[index].bid == bid) {
          if(newBbooks.length == 1) {
            newBbooks[0].bid = null;
            newBbooks[0].bookname = null;
            newBbooks[0].tlimit = null;
            break;
          }else {
            newBbooks.splice(index, 1);
            break;
          } 
        }
      }
      resolve();
    })
  }

  function updateReader(resolve,reject) {
    Reader.findOneAndUpdate({rid:rid}, {bbooks:newBbooks}, error => {
      if(error) {
        reject('数据修改失败');
      }
    })
    resolve();
  }

  function updateBook(resolve,reject) {
    Book.findOneAndUpdate({bid:bid}, bObj, error => {
      if(error) {
        reject('数据修改失败');
      }
    })
    resolve();
  }

  let promise = new Promise(findBookById)
  .then(value => {
    return new Promise(findReaderById)
  })
  .then(value => {
    return new Promise(updateBook)
  })
  .then(value => {
    return new Promise(updateReader)
  })
  .then(value => {
    sendMessageResolve(response, null, '挂失成功');
  })
  .catch(error => {
    sendMessageReject(response, '挂失失败');
  })
})

/***********************************还书******************************************/
router.post('/returnbook', (request, response, next) => {
  if(!request.user.root) return sendMessageReject(response, '权限不足');
  let bid = parseInt(request.body.bid);
  let rid = null;
  let newBbooks = [];
  let bObj = {
    status: false,
    borrowid: null,
    bdate: null
  };

  function findBookById(resolve, reject) {
    Book.findOne({bid:bid}, (error, data) => {
      if(error) return next();
      rid = data.borrowid;
      resolve();
    })
  }

  function findReaderById(resolve, reject) {
    Reader.findOne({rid:rid}, (error, data) => {
      if(error) return next();
      if(!data.bbooks[0].bid) return next();
      newBbooks = data.bbooks;
      for(let index in newBbooks) {
        if(newBbooks[index].bid == bid) {
          if(newBbooks.length == 1) {
            newBbooks[0].bid = null;
            newBbooks[0].bookname = null;
            newBbooks[0].tlimit = null;
            break;
          }else {
            newBbooks.splice(index, 1);
            break;
          } 
        }
      }
      resolve();
    })
  }

  function updateReader(resolve,reject) {
    Reader.findOneAndUpdate({rid:rid}, {bbooks:newBbooks}, error => {
      if(error) {
        reject('数据修改失败');
      }
    })
    resolve();
  }

  function updateBook(resolve,reject) {
    Book.findOneAndUpdate({bid:bid}, bObj, error => {
      if(error) {
        reject('数据修改失败');
      }
    })
    resolve();
  }

  let promise = new Promise(findBookById)
  .then(value => {
    return new Promise(findReaderById)
  })
  .then(value => {
    return new Promise(updateBook)
  })
  .then(value => {
    return new Promise(updateReader)
  })
  .then(value => {
    sendMessageResolve(response, null, '还书成功');
  })
  .catch(error => {
    sendMessageReject(response, '还书失败');
  })
})

/***********************************增******************************************/
router.post('/addbook', (request, response, next) => {

  if(!request.user.root) return sendMessageReject(response, '权限不足');

  function addBookToMongoDB(bid) {
    let book = new Book({
      bookname: request.body.bookname,
      bid: bid,
      pdate: request.body.pdate,
      author: request.body.author,
      press: request.body.press,
      bcount:0,
      status: false,
      borrowid: null,
      price: request.body.price,
      loaction: {
        floor: parseInt(request.body.floor),
        code: request.body.code,
        row: parseInt(request.body.row)
      },
      bdate: null,
      category: {
        maincate: request.body.maincate,
        childcate: request.body.childcate == 'null' ? null : request.body.childcate
      }
    });
    book.save(error => {
      if(error) return sendMessageReject(response, '图书添加失败')
    })
    sendMessageResolve(response, null, '图书添加成功');
  }

  Book.aggregate([
    {
      $group: {
        _id: null,
        max_id: {$max: '$bid'}
      }
    }
  ], (error, data) => {
    if(error) sendMessageReject(response, '图书添加失败')
    let bid = data[0].max_id + 1;
    Book.findOne({
      bookname:request.body.bookname
    }, (error, data) => {
      if(data && data.bid) {
        if(data.author.includes(request.body.author) && data.pdate.includes(request.body.pdate)) 
          return sendMessageReject(response, '添加失败，已有该图书')
        if(request.body.author.includes(data.author) && request.body.pdate.includes(data.pdate)) 
          return sendMessageReject(response, '添加失败，已有该图书')
      }
      addBookToMongoDB(bid);
    })
  })
})

/***********************************删******************************************/
router.post('/removebook', (request, response, next) => {
  let bid = request.body.bid;
  if(!request.user.root) return sendMessageReject(response, '权限不足，删除失败');
  if(!bid) return sendMessageReject(response, '删除失败');
  Book.findOneAndRemove({bid:bid}, error => {
    if(error) return sendMessageReject(response, '删除失败');
    sendMessageResolve(response, null, '删除成功')
  })
})

/***********************************改******************************************/
router.post('/updatebook', (request, response, next) => {
  if(!request.user.root) return sendMessageReject(response, '数据修改失败');
  let bookChangeOptions = {};
  bookChangeOptions.bookname = request.body.bookname;
  bookChangeOptions.author = request.body.author;
  bookChangeOptions.pdate = request.body.pdate;
  bookChangeOptions.bid = request.body.bid;
  bookChangeOptions.press = request.body.press;
  bookChangeOptions.price = request.body.price;
  bookChangeOptions.category = {
    maincate: request.body.maincate,
    childcate: request.body.childcate == 'null' ? null : request.body.childcate
  };
  bookChangeOptions.loaction = {
    floor: request.body.floor,
    code: request.body.code,
    row: request.body.row
  };
  Book.findOneAndUpdate({bid:request.body.bid}, bookChangeOptions, error => {
    if(error) return sendMessageReject(response, '数据修改失败');
    sendMessageResolve(response, null, '数据修改成功')
  })
})

/***********************************查看在借书籍******************************************/
router.post('/currbook', (request, response, next) => {
  let pageIndex = request.body.page;
  let borrowBook = [];
  Book.find({status:true}, (error, data) => {
    if(error) return next();
    for(let item of data) {
      if(item.borrowid != 0) {
        borrowBook.push(item);
      }
    }
    let pdataObj = getPageData(borrowBook, PAGE_NUMBER, pageIndex, next);
    sendMessageResolve(response, pdataObj, '数据获取成功')
  })
})

/***********************************查看超期书籍******************************************/
router.post('/timeoutbook', (request, response, next) => {
  let pageIndex = request.body.page;
  Book.find({status:true}, (error, data) => {
    if(error) return next();
    if(data.length == 0) return sendMessageResolve(response, null, '未查询到超期书籍');
    let timeoutBooks = [];
    for(let item of data) {
      if(SYSTEM_TIME - item.bdate >= 30*24*60*60*1000 && item.borrowid != 0) {
        timeoutBooks.push(item);
      }
    }
    let timeoutBooksBypage = getPageData(timeoutBooks, PAGE_NUMBER, pageIndex, next);
    sendMessageResolve(response, timeoutBooksBypage, '查询超期书籍成功')
  })
})

/**
 * 公共模块
 */
/***********************************首页列表数据******************************************/
router.get('/list', (request, response, next) => {
  let Aobj = {
    maincate: '马列主义',
    childcate: ['马克思主义','列宁主义','毛泽东思想','邓小平理论']
  }
  let Bobj = {
    maincate: '哲学'
  }
  let Cobj = {
    maincate: '社会科学',
    childcate: ['社会科学总论','政治','法律','军事','经济','文化','科学','教育','体育','语言','文字','文学','艺术','历史','地理']
  }
  let Dobj = {
    maincate: '计算机',
    childcate: ['硬件设计','数据库','办公软件','图形图像/多媒体','辅助设计与工程计算','网页制作','考试认证','人工智能','软件工程','基础知识','网络通信','游戏开发','移动开发','数据结构与算法']
  }
  let Eobj = {
    maincate: '综合性图书'
  }
  let list = [Aobj, Bobj, Cobj, Dobj,Eobj];
  sendMessageResolve(response, list, '分类列表数据获取成功');
})

/***********************************导航栏搜索******************************************/
router.post('/search', (request, response, next) => {
  let findbook = {};
  if(request.body.key == 'bookname'){
    findbook.bookname = request.body.value
  }else{
    findbook.author = request.body.value
  }
  Book.find(findbook,(error, data) => {
    if(error){
      return next();
    }
    sendMessageResolve(response, data, '首页数据获取成功')
  });
})

/***********************************查看自己的信息******************************************/
router.get('/user', (request, response, next) => {
  let usrID = request.user.usrID;
  let root = request.user.root;
  if(!usrID) return next();
  if(root) {
    Mangement.findOne({mid:usrID}, (error, data) => {
      if(error) return next();
      let mdata = showMangement(data);
      sendMessageResolve(response, mdata, '用户数据获取成功')
    });
  }else{
    Reader.findOne({rid:usrID}, (error, data) => {
      if(error) return next();
      let rdata = showReader(data);
      sendMessageResolve(response, rdata, '用户数据获取成功')
    });
  }
})

/***********************************修改邮箱和电话号码******************************************/
router.post('/updateuser', (request, response, next) => {
  let id = request.user.usrID;
  let root = request.user.root;
  let email = request.body.email;
  let phone = request.body.phone;
  if(!id) return next();
  if(root){
    Mangement.findOneAndUpdate({mid:id},{email:email,phone:phone},(error) => {
      if(error) return next();
      sendMessageResolve(response, null, '修改成功')
    });
  }else{
    Reader.findOneAndUpdate({rid:id},{email:email,phone:phone},(error) => {
      if(error) return next();
      sendMessageResolve(response, null, '修改成功')
    });
  }
})

/***********************************修改密码******************************************/
router.post('/updatepassword', (request, response, next) => {
  let usrID = request.user.usrID;
  let root = request.user.root;
  let password = request.body.password;
  if(!usrID) return next();
  function passwordUpdateError() {
    response.status(200).json({
      data: null,
      meta: {
        msg: '用户密码修改失败',
        status: 400
      }
    });
  }
  function passwordUpdateSuccess() {
    response.status(200).json({
      data: null,
      meta: {
        msg: '用户密码修改成功',
        status: 200
      }
    });
  }
  if(root) {
    Mangement.findOneAndUpdate({mid:usrID}, {password:password}, error => {
      if(error) return passwordUpdateError();
      passwordUpdateSuccess();
    });
  }else{
    Reader.findOneAndUpdate({rid:usrID}, {password:password}, error => {
      if(error) return passwordUpdateError();
      passwordUpdateSuccess();
    });
  }
})

/***********************************分类查找******************************************/
router.post('/searchcate', (request, response, next) => {
  let maincate = request.body.maincate;
  let childcate = request.body.childcate;
  let pageIndex = request.body.page;
  let category = {
    maincate,
    childcate
  }
  if(!maincate) return next();
  if(childcate == 'null') {
    Book.find({'category.maincate':maincate},(error, data) => {
      if(error) return next();
      let pdataObj = getPageData(data, PAGE_NUMBER, pageIndex, next);
      sendMessageResolve(response, pdataObj, '查找成功')
    });
  }else{
    Book.find({category},(error, data) => {
      if(error) return next();
      let pdataObj = getPageData(data, PAGE_NUMBER, pageIndex, next);
      sendMessageResolve(response, pdataObj, '查找成功')
    });
  }

})

/***********************************ID查找******************************************/
router.post('/getbook', (request, response, next) => {
  let bid = request.body.bid;
  if(!bid) return next();
  Book.findOne({bid:bid},(error, data) => {
    if(error) return next();
    sendMessageResolve(response, data, '数据获取成功')
  })
})

/**
 * 错误处理模块
 */
router.use((request, response) => {
  sendMessageReject(response, '数据获取失败')
})

module.exports = router;