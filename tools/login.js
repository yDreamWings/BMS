const dataProcess = require('../tools/dataProcess')
const jwtValue = require('../jwt')
const jwt = require('jsonwebtoken')

module.exports.Login = function(reponse, error, data, next) {
  if(error || !data){
    return next();
  }
  let id = data.mid? data.mid : data.rid;
  let root = data.mid? true : false;
  let setToken = 'Bearer ' + jwt.sign({ usrID: id, root: root},jwtValue.PRIVITE_KEY,{expiresIn: jwtValue.EXPIRESD})
  let user;
  if(data.mid){
    user = dataProcess.getMangement(data, setToken);
  }else{
    user = dataProcess.getReader(data, setToken);
  }
  reponse.status(200).json({
    data: user,
    meta: {
      msg: '登录成功',
      status: 200
    }
  })
}