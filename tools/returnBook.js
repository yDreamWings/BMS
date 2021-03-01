module.exports.returnBook = function(request, response) {
  
  let bid = parseInt(request.body.bid);
  let bdate = new Date();
  let bObj = {};
  Book.findOne({bid:bid}, (error, data) => {
    if(error) return next();
    bObj = {
      status: true,
      borrowid: 0,
      bdate
    }
    Book.findOneAndUpdate({bid:bid}, bObj, error => {
      console.log(error)
      if(error) return sendMessageReject(response, '挂失失败');
      sendMessageResolve(response, null, '挂失成功');
    })
  })
  
  let bid = parseInt(request.body.bid);
  let bdate = new Date();
  let bcount = 0;
  let bookname = null;
  let bObj = {};
  let bbooks = [];
  if(!bid) return next();

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
  
}