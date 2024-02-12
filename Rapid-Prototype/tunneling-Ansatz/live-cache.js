/* Grundcode und Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/
* Author: Lucas Jellema
* GitHub: https://github.com/lucasjellema/live-cache/blob/main/live-cache.js
*/
const cache = { "_cacheCreationTime": new Date(), "_numberOfReads": 0, "_numberOfWrites": 0 }

// Funktion von Lucas Jellema
// liest Werte aus einer Session dem Cache aus und gibt sie aus
const readFromCache = (sessionKey) => {
    try {
        let nor = cache['_numberOfReads'] + 1
        cache['_numberOfReads'] = nor
        const value = cache[sessionKey] != null ? cache[sessionKey].value : { "messages": ["Diese Gruppe existiert nicht (mehr)!"] }
        const timestamp = cache[sessionKey] != null ? cache[sessionKey].timestamp : Date.now()
        const version = cache[sessionKey] != null ? cache[sessionKey].version : 0
        console.log("Cache state: " + JSON.stringify(cache));
        return { "value": value, "timestamp": timestamp, "version": version }
    } catch (error) {
        console.error("Error in readFromCache:", error)
    }
}

// Funktion von Lucas Jellema
// schreibt Werte in den Cache und gibt einen timestamp und Versionsnummer
const writeToCache = (sessionKey, value) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[sessionKey] != null ? cache[sessionKey].version : 0) + 1
    cache[sessionKey] = { value: value, timestamp: Date.now(), version: version }
    return { timestamp: cache[sessionKey].timestamp, version: cache[sessionKey].version }
}

// Funktion von Lucas Jellema
// generiert einen neuen key und gibt diesen aus
const startNewSession = () => {
    const keyPrefixes = ["funny", "happy", "silly", "cute", "lucky", "pretty", "crazy", "outrageous"]
    const sessionKey = keyPrefixes[Math.round(keyPrefixes.length * Math.random())] + Date.now()
    cache[sessionKey] = { value: {}, timestamp: Date.now(), version: 0 }
    return { sessionKey: sessionKey }
}

// löscht eine Session aus dem Cache
const deleteSession = (sessionKey) => {
    try {
        if (cache[sessionKey]) {
            delete cache[sessionKey];
            console.log(`Session with key ${sessionKey} has been deleted.`);
            console.log("success true")
            return { success: true };
        } else {
            console.log(`Session with key ${sessionKey} not found.`);
            console.log("Error No Session found.")
            return { success: false, error: "Session not found." };
        }
    } catch (error) {
        console.error("Error in deleteSession:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

// fügt der Cache den Befehl zum abspielen eines Videos hinzu
const writeVideoStart = (sessionKey, time) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[sessionKey] != null ? cache[sessionKey].version : 0) + 1
    let value = (cache[sessionKey] != null ? cache[sessionKey].value : { "messages": [] })
    console.log("Das ist value" + JSON.stringify(value))
    value.messages.push("a1_videoStartPlay_a1" + "%" + time)
    cache[sessionKey] = { value: value, timestamp: Date.now(), version: version }
}

// fügt der Cache den Befehl zum abspielen eines Videos hinzu
const writeVideoPause = (sessionKey) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[sessionKey] != null ? cache[sessionKey].version : 0) + 1
    let value = (cache[sessionKey] != null ? cache[sessionKey].value : { "messages": [] })
    console.log("Das ist value" + JSON.stringify(value))
    value.messages.push("b2_videoStopPlay_b2")
    cache[sessionKey] = { value: value, timestamp: Date.now(), version: version }
}

module.exports = {
    readFromCache: readFromCache,
    writeToCache: writeToCache,
    startNewSession: startNewSession,
    deleteSession: deleteSession,
    writeVideoStart: writeVideoStart,
    writeVideoPause: writeVideoPause
}