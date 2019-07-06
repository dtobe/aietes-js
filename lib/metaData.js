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
      currentResIndex: 0
    };
  }

  nextResponseIndex(path, method, maxValue) {
    const metaData = this.responsesMetaData[path][method];
    if (!metaData) {
      console.warn(`No meta data for ${method} to ${path}.`);
      throw new Error('MetaData not initialized.');
    }
    const currentValue = metaData.currentResIndex;
    console.log(`calling callback for ${path} and ${method}`);
    metaData.currentResIndex = (metaData.currentResIndex + 1) % maxValue;
    return currentValue;
  }

  setDelayMs(delayMs, path, method) {
    if (isGlobalAccess(path, method)) {
      this.responsesMetaData.globalDelayMs = delayMs;
    } else {
      this.responsesMetaData[path][method].requestDelayMs = delayMs;
    }
  }

  getDelayMs(path, method) {
    if (isGlobalAccess(path, method)) {
      return this.responsesMetaData.globalDelayMs;
    }
    const requestDelayMs = this.responsesMetaData[path][method].requestDelayMs;
    return requestDelayMs || this.responsesMetaData.globalDelayMs;
  }
}

const isGlobalAccess = (path, method) => {
  return !(path && method);
};

module.exports = MetaData;
