/* Grundcode und Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/
* Author: Lucas Jellema
* GitHub: https://github.com/lucasjellema/live-cache/blob/main/live-cache.js
*/
const cache = { "_cacheCreationTime": new Date(), "_numberOfReads": 0, "_numberOfWrites": 0 }

// Funktion von Lucas Jellema
// liest MemberNamen einer Session aus dem Cache aus und gibt sie aus
const readFromCache = (cacheKey) => {
    try {
        let nor = cache['_numberOfReads'] + 1
        cache['_numberOfReads'] = nor
        const value = cache[cacheKey] != null ? cache[cacheKey].memberPrint.memberName : ["Diese Gruppe existiert nicht (mehr)!"]
        console.log("MemberCache state: " + JSON.stringify(cache));
        console.log("Dein Großvater war hier und hieß: " + JSON.stringify(value))
        return { "value": value }
    } catch (error) {
        console.error("Error in readFromCache:", error)
    }
}

// Funktion von Lucas Jellema
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

// löscht Member eine Session aus dem Cache
const deleteSession = (cacheKey) => {
    try {
        if (cache[cacheKey]) {
            delete cache[cacheKey];
            console.log(`Session with key ${cacheKey} has been deleted.`);
            console.log("success true")
            return { success: true };
        } else {
            console.log(`Session with key ${cacheKey} not found.`);
            console.log("Error No Session found.")
            return { success: false, error: "Session not found." };
        }
    } catch (error) {
        console.error("Error in deleteSession:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

module.exports = {
    readFromCache: readFromCache,
    writeToCache: writeToCache,
    deleteSession: deleteSession
}