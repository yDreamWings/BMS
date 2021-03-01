const changeData = {
  changeReaderById(Reader, id, changeValue, next, response){
    Reader.findOneAndUpdate({rid:id}, changeValue, error => {
      if(error) return next();
      response.status(200).json({
        data: null,
        meta: {
          msg: '数据修改成功',
          status: 200
        }
      })
    })
  },
  changeBookById(Book, id, changeValue, next, response){
    Book.findOneAndUpdate({bid:id}, changeValue, error => {
      if(error) return next();
      response.status(200).json({
        data: null,
        meta: {
          msg: '数据修改成功',
          status: 200
        }
      })
    })
  },
  ReaderFindById(Reader, id, next, callback) {
    Reader.findOne({rid:id}, (error, data) => {
      if(error) return next();
      callback(data);
    });
  },
  BookFindById(Book, id, next, callback) {
    Book.findOne({bid:id}, (error, data) => {
      if(error) return next();
      callback(data);
    });
  }
}

module.exports = changeData;