/* Grundcode und Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/
* Author: Lucas Jellema
* GitHub: https://github.com/lucasjellema/live-cache/blob/main/live-cache.js
*/
const cache = { "_cacheCreationTime": new Date(), "_numberOfReads": 0, "_numberOfWrites": 0 }

/*
// erstellt ein neue Gruppe
const initializeCache = (sessionKey) => {
    console.log("Das Ist der SessionKey fürs Initalizing: " + sessionKey)
    cache[sessionKey] = { memberPrint: { print: [], memberName: [] }, memberPermission: { print: [], memberName: [] }, timestamp: Date.now(), version: 0 }
}
*/

// sucht den Print eines Members aus dem Cache der Session
const convertToPrint = (sessionKey, member) => {
    if (cache[sessionKey]) {
        const index = cache[sessionKey].memberPrint.memberName.indexOf(member)
        console.log("Index gefunden: " + index)
        if (index !== -1) return cache[sessionKey].memberPrint.print[index]
    }
    return ""
}

// Funktion von Lucas Jellema
// liest MemberNamen einer Session aus dem Cache aus und gibt sie aus
const readFromCache = (sessionKey) => {
    try {
        let nor = cache['_numberOfReads'] + 1
        cache['_numberOfReads'] = nor
        const value = cache[sessionKey] != null ? cache[sessionKey].memberPrint.memberName : ["Diese Gruppe existiert nicht (mehr)!"]
        console.log("MemberCache state: " + JSON.stringify(cache));
        return { "value": value }
    } catch (error) {
        console.error("Error in readFromCache:", error)
    }
}

// Urfunktion von Lucas Jellema
// schreibt Werte in den Cache und gibt einen timestamp und Versionsnummer
const writeToCache = (sessionKey, fingerprint, member) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[sessionKey] != null ? cache[sessionKey].version : 0) + 1
    let prints = (cache[sessionKey] != null ? cache[sessionKey].memberPrint.print : [])
    let members = (cache[sessionKey] != null ? cache[sessionKey].memberPrint.memberName : [])
    let perPrints = (cache[sessionKey] != null ? cache[sessionKey].memberPermission.print : [])
    prints.push(fingerprint)
    if (cache[sessionKey] != null ? cache[sessionKey].memberPrint.memberName.includes(member) : false) {
        let suffix = 1;
        while (cache[sessionKey].memberPrint.memberName.includes(member + suffix)) { // Fügt dem Ende des Nutzer Namens eine aufsteigende Zahl hinzu bis der Nutzername einzigartig ist
            suffix++;
        }
        members.push(member + suffix);
    } else {
        members.push(member);
    }
    cache[sessionKey] = { memberPrint: { print: prints, memberName: members }, memberPermission: { print: perPrints }, timestamp: Date.now(), version: version }
    return { timestamp: cache[sessionKey].timestamp, version: cache[sessionKey].version }
}

// löscht Member eine Session aus dem Cache
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

// gibt einem Member Rechte für die Session
const addPermission = (sessionKey, member) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[sessionKey] != null ? cache[sessionKey].version : 0) + 1
    let prints = (cache[sessionKey] != null ? cache[sessionKey].memberPrint.print : [])
    let members = (cache[sessionKey] != null ? cache[sessionKey].memberPrint.memberName : [])
    let perPrints = (cache[sessionKey] != null ? cache[sessionKey].memberPermission.print : [])
    const print = convertToPrint(sessionKey, member)
    if (!cache[sessionKey].memberPermission.print.includes(print) && print !== "") {
        perPrints.push(print)
        console.log("Gebe Print Rechte!: " + print)
        cache[sessionKey] = { memberPrint: { print: prints, memberName: members }, memberPermission: { print: perPrints }, timestamp: Date.now(), version: version }
    }
    return cache[sessionKey]
}

// gibt dem Host Rechte für die Session
const addHost = (sessionKey, hostPrint) => {
    let numberOfWrites = cache['_numberOfWrites'] + 1
    cache['_numberOfWrites'] = numberOfWrites
    let version = (cache[sessionKey] != null ? cache[sessionKey].version : 0) + 1
    let prints = (cache[sessionKey] != null ? cache[sessionKey].memberPrint.print : [])
    let members = (cache[sessionKey] != null ? cache[sessionKey].memberPrint.memberName : [])
    let perPrints = (cache[sessionKey] != null ? cache[sessionKey].memberPermission.print : [])
    perPrints.push(hostPrint)
    console.log("Gebe Host Rechte!: " + hostPrint)
    cache[sessionKey] = { memberPrint: { print: prints, memberName: members }, memberPermission: { print: perPrints }, timestamp: Date.now(), version: version }
    return cache[sessionKey]
}

const hasPermission = (sessionKey, fingerprint) => {
    if (cache[sessionKey]) {
        return cache[sessionKey].memberPrint.print.includes(fingerprint) && cache[sessionKey].memberPermission.print.includes(fingerprint)
    }
    else return false
}

module.exports = {
    readFromCache: readFromCache,
    writeToCache: writeToCache,
    deleteSession: deleteSession,
    addPermission: addPermission,
    hasPermission: hasPermission,
    addHost: addHost
    //initializeCache: initializeCache
}