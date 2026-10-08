module.exports = {
    uiPort: 1880,
    flowFile: 'flows.json',
    contextStorage: {
        default: { module: 'localfilesystem', config: { flushInterval: 5 } }
    },
    functionGlobalContext: {},
    logging: { console: { level: 'info', metrics: false, audit: false } }
};
