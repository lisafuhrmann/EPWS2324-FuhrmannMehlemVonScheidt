// Code und Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/
const cache = { "_cacheCreationTime": new Date(), "_numberOfReads": 0, "_numberOfWrites": 0 }
//const prints = []
//const members = []

// liest Werte aus dem Cache aus und gibt sie aus
const readFromCache = (cacheKey) => {
    try {
        let nor = cache['_numberOfReads'] + 1
        cache['_numberOfReads'] = nor
        const value = cache[cacheKey] != null ? cache[cacheKey].memberPrint.memberName : { "Soose": "Ganz viel Soose" }
        console.log("MemberCache state: " + JSON.stringify(cache));
        //console.log("Cache key:", cacheKey);
        console.log("Dein Großvater war hier und hieß: " + JSON.stringify(value))
        return { "value": value }
    } catch (error) {
        console.error("Error in readFromCache:", error)
    }
}

// schreibt Werte in den Cache und gibt einen timestamp und Versionsnummer
const writeToCache = (cacheKey, fingerprint, member) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[cacheKey] != null ? cache[cacheKey].version : 0) + 1
    let prints = (cache[cacheKey] != null ? cache[cacheKey].memberPrint.print : [])
    let members = (cache[cacheKey] != null ? cache[cacheKey].memberPrint.memberName : [])
    prints.push(fingerprint)
    members.push(member)
    cache[cacheKey] = { memberPrint: { print: prints, memberName: members }, timestamp: Date.now(), version: version }
    return { timestamp: cache[cacheKey].timestamp, version: cache[cacheKey].version }
}

/*
// generiert einen neuen key und gibt diesen aus
const startNewSession = () => {
    const keyPrefixes = ["funny", "happy", "silly", "cute", "lucky", "pretty", "crazy", "outrageous"]
    const sessionKey = keyPrefixes[Math.round(keyPrefixes.length * Math.random())] + Date.now()
    cache[sessionKey] = { value: {}, timestamp: Date.now(), version: 0 }
    return { sessionKey: sessionKey }
}
*/

module.exports = {
    readFromCache: readFromCache,
    writeToCache: writeToCache,
    //startNewSession: startNewSession
}