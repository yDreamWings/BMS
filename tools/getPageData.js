module.exports.getPageData = function(data, PAGE_NUMBER, pageIndex, next) {
  let length = data.length;
  let page = Math.ceil(length / PAGE_NUMBER);
  let pdata = [];

  if(pageIndex > page && pageIndex <= 0) return next();
  if(page == 1){
    pdata = data;
  }else{
    let startIndex = (pageIndex - 1)*PAGE_NUMBER;
    let endIndex = startIndex + PAGE_NUMBER;
    if(endIndex > length) endIndex = length;
    for(let i = startIndex; i < endIndex; i++){
      pdata.push(data[i]);
    }
  }
  return {pdata, length, page};
}