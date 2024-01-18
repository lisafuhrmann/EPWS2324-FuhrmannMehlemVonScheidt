// Ursprungscode und Konzept von: https://technology.amis.nl/cloud/implementing-serverless-multi-client-session-synchronization-with-oracle-cloud-infrastructure/
import * as cache from './live-cache.js'

// Html Benutzeroberfläche
const html = `
  <!DOCTYPE html>
<html>

<head>
    <script>
        const cacheServiceEndpoint = "https://8zkge56d9a.execute-api.eu-central-1.amazonaws.com/VrM_0_1"
        const postEndpoint = "https://hk5gmdjhz1.execute-api.eu-central-1.amazonaws.com/creating"
        const pureEndpoint = "https://vjwcjedbbuofaqxo55qgs77r5m0pobho.lambda-url.eu-central-1.on.aws/"
        
        const allowedHeader = { 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, PUT, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
        }
        
        let sessionKey;
        const sessionRefreshIntervalDuration = 5000
        let sessionContextFreshInterval
        let inSession = false
        let messages = []
        
        const startSession = async () => {
            document.getElementById("sessionKey").innerText = ""
            const response = fetch(cacheServiceEndpoint,
            {
                "method": "POST",
                "mode": "cors"
            }
            )
            response.then(data => data.json()).then((json) => {
                console.log(json)
                sessionKey = JSON.stringify(json.body.sessionKey)
                console.log("new session initialized with key " + sessionKey)
                joinSession(sessionKey)
                pushSessionContext({messages : messages})
            });
        }

        const joinSession = async (sessionToJoinKey = sessionKey) => {
            sessionKey = sessionToJoinKey
            document.getElementById("sessionKey").innerText = sessionKey
            sessionContextFreshInterval = setInterval(() => retrieveSessionContext(), sessionRefreshIntervalDuration)
            inSession = true
        }

        const retrieveSessionContext = async () => {
            const requestOptions = {
                "method": "GET",
                "mode": "cors",
                "redirect": "follow"
            };

            fetch(cacheServiceEndpoint + "?sessionKey=" + sessionKey, requestOptions)
                .then(response => response.json())
                .then(result => processSessionContext(result))
                .catch(error => console.log('error', error));
        }

        const pushSessionContext = async (sessionContext) => {
            const requestHeaders = new Headers();
            requestHeaders.append("Content-Type", "application/json");
            
            const requestOptions = {
                "headers": { "Content-Type": "application/json" },
                "method": "PUT",
                "mode": "cors",
                "redirect": "follow",
                "body": {value: sessionContext}
            }
            console.log(requestOptions)
            
            fetch(cacheServiceEndpoint + "?sessionKey=" + sessionKey, requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(result => console.log("Result of session context push: " + JSON.stringify(result.body)))
            .catch(error => console.log('error', error));
        }

        const processSessionContext = (sessionContext) => {
            const messagesTextarea = document.getElementById("messages")
                console.log("Das hab ich bekommen: " + JSON.stringify(sessionContext))
                console.log("Das sagen die Leute: " + sessionContext.value)
            messages = sessionContext.value.messages
            const messageContent = messages.reduce((sum, message, index) => sum + (index > 0 ?" ":"") + message, "")
            messagesTextarea.value = messageContent
        }
        
        window.onload = function(){
          function initializePage() {
            document.getElementById("startSession").addEventListener("click", () => { startSession() })
            document.getElementById("joinSession").addEventListener("click", () => {
                const joinSessionKey = document.getElementById("joinSessionKey").value
                joinSession(joinSessionKey)
            })
            document.getElementById("sendMessage").addEventListener("click", () => {
                const message = document.getElementById("message").value
                messages.push(message)
                pushSessionContext({messages : messages})
            })
          }
          
          initializePage();
        }
    </script>
</head>

<body>
    <label for="joinSessionKey">Session Key for Session To Join</label>
    <input id="joinSessionKey"></input>
    <input type="button" id="joinSession" value="Join Existing Multi Client Session" />
    <input type="button" id="startSession" value="Start Multi Client Session" />
    <h3>Multi Client Session Identifier <p id="sessionKey"></p></h3>
    <hr />
    <label for="message" >Message to Send</label>
    <input id="message" />
    <input type="button" id="sendMessage" value="Send Message" />
    <br />
    <textarea id="messages" rows="10" columns="80" ></textarea>
</body>

</html>
  `

// from: https://davidwalsh.name/query-string-javascript
const getUrlParameter = (url, name) => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(url);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// Header für CORS Responses
const allowedHeader = { 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*',
}

// funktion um API calls zu senden
const sendIt = (result) => {
  console.log("Result: " + JSON.stringify(result))
  
  const response = {
    statusCode: 200,
    body: result,
    headers: allowedHeader,
  };
    
  return response
}

// funktion um html seite auszugeben
const sendHtml = () => {
  const htmlResponse = {
    statusCode: 200,
    body: html,
    headers: { "Content-Type": "text/html" }
  }
  return htmlResponse
}

// AWS Lambda funktion die mit aufruf der Funktion gefeuert wird.
export const handler = async (event) => {
  let result = { Soose: "Soose" }
  const httpMethod = event.method; 
  const requestURL = event.url;
  // GET (retrieve session context), PUT (update session context), POST (create new session context)
  const sessionKey = getUrlParameter(requestURL, "key") // not meaningful for POST call
    
  if ("GET" == httpMethod) {
      //result = cache.readFromCache(sessionKey)
      console.log("Deine Mudda war hier")
      return sendIt(await cache.readFromCache(sessionKey))
  }
  else if ("PUT" == httpMethod) {
    //const jsonBody = JSON.parse(event.body);
    //result = cache.writeToCache(sessionKey, jsonBody.value)
    return sendIt(await cache.writeToCache(sessionKey, event.value))
  }
  else if ("POST" == httpMethod) {
    return sendIt(await cache.startNewSession())
    
  }
  else if ("OPTIONS" == httpMethod) {
    return "Das Kitzelt!"
  }
  else {
    //return "Das hab ich gehört: " + httpMethod + "Kannst du wieder haben: " + JSON.stringify(event)
    return sendHtml();
  }
};
