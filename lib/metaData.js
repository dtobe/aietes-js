class MetaData {
  constructor() {
    this.responsesMetaData = {};
  }

  clear() {
    this.responsesMetaData = {};
  }

  initMetaDataForHandler(path, method) {
    if (!this.responsesMetaData[path]) {
      this.responsesMetaData[path] = {};
    }
    if (!this.responsesMetaData[path][method]) {
      this.responsesMetaData[path][method] = {};
    }
    this.responsesMetaData[path][method] = {
      currentResIndex: 0,
    };
  }

  nextResponseIndex(path, method, maxValue) {
    const metaData = this.responsesMetaData[path][method];
    if (!metaData) {
      console.warn(`No meta data for ${method} to ${path}.`);
      return 0;
    }
    const currentValue = metaData.currentResIndex;
    console.log(`calling callback for ${path} and ${method}`);
    metaData.currentResIndex = (metaData.currentResIndex + 1) % maxValue;
    return currentValue;
  }

  setDelay(delay, path, method) {
    if (!path || !method) {
      this.responsesMetaData.globalDelay = delay;
    } else {
      this.responsesMetaData[path][method].requestDelay = delay;
    }
  }

  getDelay(path, method) {
    if (!path || !method) {
      return this.responsesMetaData.globalDelay;
    }
    const requestDelay = this.responsesMetaData[path][method].requestDelay;
    return requestDelay ? requestDelay : this.responsesMetaData.globalDelay;
  }
}

module.exports = MetaData;