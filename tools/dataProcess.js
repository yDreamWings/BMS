const dataProcess = {
  getMangement(data, setToken) {
    const obj = {
      mid: data.mid,
      name: data.name,
      sex: data.sex,
      unit: data.unit,
      root: data.root,
      token: setToken,
      email: data.email,
      phone: data.phone
    }
    return obj;
  },
  getReader(data, setToken) {
    const obj = {
      rid: data.rid,
      name: data.name,
      sex: data.sex,
      unit: data.unit,
      bbooks: data.bbooks,
      root: data.root,
      token: setToken,
      email: data.email,
      phone: data.phone
    }
    return obj;
  },
  showMangement(data) {
    const obj = {
      mid: data.mid,
      name: data.name,
      sex: data.sex,
      unit: data.unit,
      email: data.email,
      phone: data.phone
    }
    return obj;
  },
  showReader(data) {
    const obj = {
      rid: data.rid,
      name: data.name,
      sex: data.sex,
      unit: data.unit,
      bbooks: data.bbooks,
      email: data.email,
      phone: data.phone
    }
    return obj;
  }
}

module.exports = dataProcess;