// Code und Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/
const cache = { "_cacheCreationTime": new Date(), "_numberOfReads": 0, "_numberOfWrites": 0 }

// liest Werte aus dem Cache aus und gibt sie aus
const readFromCache = (cacheKey) => {
    try {
        let nor = cache['_numberOfReads'] + 1
        cache['_numberOfReads'] = nor
        const value = cache[cacheKey] != null ? cache[cacheKey].value : { "Soose": "Ganz viel Soose" }
        console.log("Deine Vater war hier und: " + JSON.stringify(value))
        return { "value": value }
    } catch (error) {
        console.error("Error in readFromCache:", error)
        throw error; // Rethrow the error to ensure it's logged in CloudWatch
    }
}

// schreibt Werte in den Cache und gibt einen timestamp und Versionsnummer
const writeToCache = (cacheKey, value) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[cacheKey] != null ? cache[cacheKey].version : 0) + 1
    cache[cacheKey] = { value: value, timestamp: Date.now(), version: version }
    return { timestamp: cache[cacheKey].timestamp, version: cache[cacheKey].version }
}

// generiert einen neuen key und gibt diesen aus
const startNewSession = () => {
    const keyPrefixes = ["funny", "happy", "silly", "cute", "lucky", "pretty", "crazy", "outrageous"]
    const sessionKey = keyPrefixes[Math.round(keyPrefixes.length * Math.random())] + Date.now()
    cache[sessionKey] = { value: {}, timestamp: Date.now(), version: 0 }
    return { sessionKey: sessionKey }
}


module.exports = {
    readFromCache: readFromCache,
    writeToCache: writeToCache,
    startNewSession: startNewSession

}