const contextMenu = document.getElementById("contextmenu")
const appPanel = document.getElementById("apppanel");
const appBar = document.getElementById("appbar");
const loadBar = document.getElementById("cw-load-bar");
const finder = document.querySelector(".finder");
const finderBox = document.querySelector(".finder-box");
const yes = true;
const no = false;

var currentApp = "home";

var apps = null;
var appData = [];
var themes = null;

// Version numbers for v1 use BASE.FEATURE.PATCH, with FEATURE combining MAJOR and MINOR.

// Version numbers for v2 are similar to semantic versioning v2.0.0

// BASE.MAJOR.MINOR.PATCH

// can append -betaVERSION to the end, can also have -indev, 
// to signify versions that are not for any user's consumption

// BASE is the base this version is based on (0 is clockwork v1 beta, 
// 1 is clockwork v1 release, 2 is clockwork v2)

// MAJOR is non-backwards-compatible feature changes (for example, 
// changes that require app developers to update their apps)

// MINOR is backwards-compatible feature changes

// PATCH is backwards-compatible changes for security and bug fixes only

var version = "2.0.0.0-beta11";

document.getElementById("versiontxt").innerText = version;

contextMenu.style.display = "none";

// The stuff that you can search up using the Finder
const searchables = [
  {
    searchText: ["store","app","theme"],
    name: "Clockwork Store",
    icon: "none",
    onclick: function(){
      openApp(
        "/assets/apps/store.json",
        "NOWWITHHDMI2.1(V1.1.0BETA)#l08#l20#l20#l16#l19#bs22#bs28#bs28#l03#l12#l15#l03#l11#l23#l15#l18#l11#bs16#l19#l20#l15#l18#l05#bs13#l07#l12#l09#l20#l03#l08#bs13#l13#l05#bs28#l22#num02#bs28",
        true
      );
    },
  },
  {
    searchText: ["apps","manage apps"],
    name: "Manage Apps",
    icon: "none",
    onclick: function(){
      openApp('sys_settings_apps');
    },
  },
]


// ULTRAVIOLET ENCODING AND DECODING
// THIS IS REQUIRED FOR USING A PROXY
function encodeUV(str){
  if (!str) return str;
  return encodeURIComponent(str.toString().split('').map((char, ind) => ind % 2 ? String.fromCharCode(char.charCodeAt() ^ 2) : char).join(''));
}
function decodeUV(str){
  if (!str) return str;
  let [ input, ...search ] = str.split('?');

  return decodeURIComponent(input).split('').map((char, ind) => ind % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char).join('') + (search.length ? '?' + search.join('?') : '');
}

var defaultSettings = {
  // Lock screen settings
  lock: {
    enabled: false,
    passcode: "0000",
  },
  clockType: "12h",
  // Proxy settings
  proxy: "none",
  proxyUrl: "",
}
var settings = null;

// moveInArray
function moveInArray(arr, old_index, new_index) {
  var old_item = arr[old_index];
  arr.splice(old_index, 1);  
  
  arr.splice(new_index, 0, old_item);  
  return arr;
}

var firstBoot = false;

// get settings
// if no settings, will add defaults + mark this as the first boot
if (localStorage.getItem("settings") == null || localStorage.getItem("settings") == "!!reset") {
  localStorage.setItem("settings", JSON.stringify(defaultSettings));
  settings = defaultSettings;
  firstBoot = true;
} else {
  settings = JSON.parse(localStorage.getItem("settings"));
}

// make sure all required settings for clockwork are there
if (!settings.clockType) {
  settings.clockType = "12h"
  localStorage.setItem("settings", JSON.stringify(settings));
}
document.getElementById("set_clockchange").value = settings.clockType;

if (!settings.proxy) {
  settings.proxy = "none";
  settings.proxyUrl = "";
  localStorage.setItem("settings", JSON.stringify(settings));
}
document.getElementById("set_proxy").value = settings.proxy;
document.getElementById("set_proxyurl").value = settings.proxyUrl;

// get themes
if (localStorage.getItem("themes") == null || localStorage.getItem("themes") == "!!reset") {
  localStorage.setItem("themes", JSON.stringify(new Array()));
  themes = [];
} else {
  themes = JSON.parse(localStorage.getItem("themes"));
}

// get apps
if (localStorage.getItem("apps") == null || localStorage.getItem("apps") == "!!reset") {
  apps = [
    // CLOCKWORK APP STORE
    "/assets/apps/store.json",
    // MUENSTER
    "/assets/apps/muenster.json"
  ];
  localStorage.setItem("apps", JSON.stringify(apps));
} else {
  apps = JSON.parse(localStorage.getItem("apps"));
}

loadBar.max = apps.length + themes.length;
loadBar.value = 0;
for (let i = 0; i < apps.length; i++) {
  installApp(apps[i], {start: true});
}
for (let i = 0; i < themes.length; i++) {
  installTheme(themes[i]);
  ++loadBar.value;
}

document.getElementById("clockwork-content").style = "display: none;";

// loading screen
function checkForFinish() {
  if (loadBar.max == loadBar.value) {
  	document.getElementById("clockwork-loading").style = "display: none;";
		if (settings.lock.enabled == true || settings.lock.enabled == "true") {
      document.getElementById("clockwork-lock").style = "";
      document.getElementById("clockwork-lock").className = "clockwork-panel clockwork-panel-fadein";
      pcodeInput.focus();
    } else {
      document.getElementById("clockwork-content").style = "";
    }
  } else {
    setTimeout(checkForFinish, 500);
  }
}
setTimeout(checkForFinish, 500);

// sidebar clock
function sideBarClock() {
  const today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  if (settings.clockType == "12h") {
    if (h > 12) {
   	  document.getElementById('appsidebar-clock').innerHTML =  (h - 12) + ":" + m + ":" + s + " PM";
    } else {
      document.getElementById('appsidebar-clock').innerHTML =  h + ":" + m + ":" + s + " AM";
    }
  } else {
    document.getElementById('appsidebar-clock').innerHTML =  h + ":" + m + ":" + s;
  }
}
function checkTime(i) {
  if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
}
sideBarClock();
setInterval(sideBarClock, 500);

// main stuff
async function installApp(url,params) {
  if (url === null | url === undefined) {
    url = prompt("ID is undefined or null, enter a URL (or leave blank to cancel)");
  }
  if (url === null || url === undefined) {
    throw "ID is undefined or null";
  }
	try {
	  let response = await fetch(url, {cache: "reload", mode: "cors",});

		if (response.ok) {
      if (appData.find(function(o) {
          return o.url == url
        })){
        throw "App already installed!";
      }
		  let json = await response.text();
      json = JSON.parse(json);
      let myIframe = document.createElement("IFRAME");
      myIframe.src = "about:blank";
      myIframe.id = "apppanel:"+url;
      appPanel.appendChild(myIframe);
      var myAppData = {
        name: json.name,
        desc: json.desc,
        url: url,
        appUrl: json.url,
        version: json.version,
        encodedUrl: json.encodedUrl,
        permissions: json.permissions,
      }
      appData.push(myAppData);
      
	    appBar.innerHTML += `<btn id="appbar:${url}" 
      onclick="openApp('${url}','${json.url}',${json.encodedUrl})" 
      oncontextmenu="appContextMenu('${url}')"
      draggable="true">
      <img draggable="false" src="${json.icon}"></btn>`;

      // THIS IS IN THE MANAGE APPS PART OF SETTINGS
      document.getElementById("cw_manageapps_span").innerHTML += `<details class="mngappspnl" id="mngapps:${url}">
      <summary>
      <img src="${json.icon}"> 
      <span>${json.name}</span> `+
      (function () {
        if (typeof json.desc == "string") {
          return json.desc;
        } else {
          return "No description";
        }
      })()
      +`
      </summary>
      <p>
      <btn onclick="closeApp('${url}')">Close app</btn><br>
      <btn onclick="uninstallApp('${url}')">Uninstall app</btn>
      </p>
      </details>`

      if (apps.includes(url) == false) {
        apps.push(url);
        localStorage.setItem("apps", JSON.stringify(apps));
      }
      document.getElementById("appbar:"+url).style = "order: "+apps.indexOf(url)+";";
      /*document.getElementById("appbar:"+url).addEventListener("dragstart", (event) =>{
  		event.dataTransfer.setData("text/plain", url);
      });
      document.getElementById("appbar:"+url).addEventListener("dragover", (event) => {
        event.preventDefault();
        return false;
      });
          document.getElementById("appbar:"+url).addEventListener("drop", (event) => {
          	var daita = event.dataTransfer.getData("text/plain");
  			//daita = event.target.textContent;
  			event.preventDefault();
            alert(daita);
          });*/

		} else {
		  var retry = confirm("HTTP error while installing app: " + response.status + "\nApp url: "+url+"\nRetry?");
      if (retry == true) {
        if (params.start == true) {
          --loadBar.value;
          --loadBar.value;
        }
        installApp(url, params);
      }
		}
	} catch (error) {
	  alert("Error: " + error);
	}
  if (params.start) {
    ++loadBar.value;
  }
}

async function promptInstallApp(url,params) {
  let response = await fetch(url, {cache: "reload", mode: "cors",});

	if (response.ok) {
    let json = await response.text();
    json = JSON.parse(json);

    if (json.permissions.includes("noUninstall")) {
      throw "invalidAppPermissionError";
    }

    var prompt = document.getElementById("clockwork-prmpt").cloneNode(true);
    prompt.id = "installprompt-"+(Math.ceil(Math.random()*9999999));
    prompt.className = "clockwork-panel clockwork-panel-fadein";

    prompt.querySelector(".prmpt-title").innerHTML = `App installation confirmation`;
    prompt.querySelector(".prmpt-text").innerHTML = `Are you sure you want to install ${json.name}?`;
    prompt.querySelector(".prmpt-yes").onclick = function() {
      installApp(url,params);
      prompt.className = "clockwork-panel clockwork-panel-fadeout";
      setTimeout(function() {prompt.style = "display: none;"}, 300)
    }
    prompt.querySelector(".prmpt-no").onclick = function() {
      prompt.className = "clockwork-panel clockwork-panel-fadeout";
      setTimeout(function() {prompt.style = "display: none;"}, 300)
    }
    
    prompt.style = "";

    document.body.appendChild(prompt);
  } else {
    var retry = confirm("HTTP error while getting app data: " + response.status + "\nApp url: "+url+"\nRetry?");
    if (retry == true) {
      promptInstallApp(url, params);
    }
  }
}

function openApp(app, url, encoded) {
  if (app == null || app == undefined) {
    throw "app ID is undefined";
  }
  currentApp = app;
  for (const child of document.getElementById("appbar").children) {
    child.className = "";
    if (child.id == "appbar:"+app) {
      child.className = "appbtnopen";
    }
  }
  for (const child of appPanel.children) {
    child.className = "app";
    if (child.id == "apppanel:"+app) {
      child.className = "app appopen";
      if (child.tagName == "IFRAME" || child.tagName == "EMBED") {
        if ("about:blank" == child.src) {
          var trueurl = "";
          if (encoded == true) {
            var i829X = (function() {function HFeg8(j92Ie){var ZiWfX="";for(var kk291=0;kk291<j92Ie.length;kk291+=2){ZiWfX+=String.fromCharCode(parseInt(j92Ie.substr(kk291,2),16))}return ZiWfX}; return eval('HFeg8("6465636F646543572875726C29")')})();
            trueurl = eval(i829X);
          } else {
            trueurl = url;
          }
          if (settings.proxy == "uv") {
            if (settings.proxyUrl.length > 10) {
              trueurl = settings.proxyUrl+encodeUV(trueurl)
            } else {
              trueurl = "https://toddler-kicking-machine.umlach.org/service/"+encodeUV(trueurl)
            }
          }
          child.src = trueurl;
          child.onload = function() {
            child.contentWindow.postMessage(child.id.slice(9),"*");      
          }
        }
      }
    }
  }
}
function closeApp(app) {
  if (app == null || app == undefined) {
    throw "app ID is undefined";
  }
  for (const child of appPanel.children) {
    if (child.id == "apppanel:"+app) {
      child.className = "app";
      if (child.tagName == "IFRAME" || child.tagName == "EMBED") {
        child.src = "about:blank";
      } 
    }
  }
  if (app == currentApp) {
    openApp("sys_home")
  }
}
function moveApp(app,type,plus) {
  if (app == null || app == undefined) {
    throw "app ID is undefined";
  }
  var appIndex = apps.indexOf(app);
  if (appIndex != undefined) {
    if (type == "add") {
      apps = moveInArray(apps, appIndex, appIndex+plus);
    } else {
      apps = moveInArray(apps, appIndex, plus);
    }
    for (let i = 0; i < apps.length; i++) {
      var z = document.getElementById("appbar:"+apps[i]);
      if (z) {
        z.style = "order: "+i+";";
      }
    }
    localStorage.setItem("apps", JSON.stringify(apps));
  } else {
    throw "app does not exist at";
  }
}
function uninstallApp(app) {
  if (app == null || app == undefined) {
    throw "app ID is undefined";
  }
  var entry = appData.find(function(o) {
    return o.url == app
  });

  if (entry.permissions.includes("noUninstall")) {
    alert("Cannot uninstall app!");
    throw "noUninstallAppError";
  }

  var ask = confirm("Are you sure you want to uninstall this app?");
  if (ask == true) {
    let index = apps.indexOf(app);
    if (typeof index == "number") {
      apps.splice(index, 1);
      document.getElementById("apppanel:"+app).remove();
      document.getElementById("appbar:"+app).remove();
      document.getElementById("mngapps:"+app).remove();
      if (entry){
        appData.splice(appData.indexOf(entry), 1);
      }
    }
    localStorage.setItem("apps", JSON.stringify(apps));
  }
  if (app == currentApp) {
    openApp("sys_home")
  }
}

// context menu when u right click an app icon
function appContextMenu(app) {
  event.preventDefault();
  const {clientX: mouseX, clientY: mouseY} = event;
  
  contextMenu.style.display = "block";
  contextMenu.style.left = mouseX+"px";
  if (mouseY > window.innerHeight) {
    contextMenu.style.top = mouseY-25+"px";
  } else {
    contextMenu.style.top = mouseY-25-contextMenu.offsetHeight+"px";
  }
  
  setTimeout(function() {
    contextMenu.className = "visible";
    contextMenu.style.top = Number(contextMenu.style.top.slice(0,-2))+25+"px";
  }, 50);
  
  document.getElementById("cm:closeapp").onclick = function(){
    closeApp(app);
  };
  document.getElementById("cm:uninstallapp").onclick = function(){
    uninstallApp(app);
  };

  document.getElementById("cm:mleft").onclick = function(){
    moveApp(app, 'add', -1);
  };
  document.getElementById("cm:mright").onclick = function(){
    moveApp(app, 'add', 1);
  };
}

// themes
async function reloadThemes() {
  document.querySelector("#cw_managethemes_span").innerHTML = "";
  document.querySelector("stylesheets").innerHTML = "";
  for (let i = 0; i < themes.length; i++) {
    await installTheme(themes[i]);
  }
}

async function installTheme(url) {
  if (url === null | url === undefined) {
    url = prompt("ID is undefined or null, enter a URL (or leave blank to cancel)");
  }
  if (url === null || url === undefined) {
    throw "ID is undefined or null";
  }
  if (document.getElementById("theme:"+url) != null) {
    document.getElementById("theme:"+url).remove()
  } 
  try {
	  let response = await fetch(url, {cache: "reload", mode: "cors",});

		if (response.ok) { 
	    // get the response body (the method explained below)
		  let style = await response.text();
      let html = '<style id="theme:'+style+'">'+style+"</style>";

      let title = style.match(/^\/\*theme title: ([^\n]+)\*\/$/m)[1];
      let desc = style.match(/^\/\*theme desc: ([^\n]+)\*\/$/m);
      
      if (!title) throw "PropertyMissing";

      document.getElementById("cw_managethemes_span").innerHTML += `<details class="mngthmspnl" id="mngthms:${url}">
      <summary>
      <span>${title}</span> `+
      (function() {
        if (!desc) {
          return "No description";
        } else {
          return desc[1];
        }
      })()
      +`
      </summary>
      <p>
      <btn onclick="moveTheme('${url}','add',-1)">Move Up</btn> <btn onclick="moveTheme('${url}','add',1)">Move Down</btn><br>
      <btn onclick="uninstallTheme('${url}')">Uninstall Theme</btn>
      </p>
      </details>`
      document.querySelector("stylesheets").innerHTML = html + document.querySelector("stylesheets").innerHTML;
      if (themes.includes(url) == false) {
        themes.push(url);
        localStorage.setItem("themes", JSON.stringify(themes));
      }
		} else {
		  alert("HTTP error while installing theme: " + response.status + "\nTheme url: "+url);
		}
	} catch (error) {
	  alert("Error: " + error);
	}
}

async function moveTheme(app,type,plus) {
  if (app == null || app == undefined) {
    throw "app ID is undefined";
  }
  var appIndex = themes.indexOf(app);
  if (appIndex != undefined) {
    if (type == "add") {
      themes = moveInArray(themes, appIndex, appIndex+plus);
    } else {
      themes = moveInArray(themes, appIndex, plus);
    }
    
    localStorage.setItem("themes", JSON.stringify(themes));
    await reloadThemes();
  } else {
    throw "app does not exist at";
  }
}

async function uninstallTheme(app) {
  if (app == null || app == undefined) {
    throw "app ID is undefined";
  }
  var appIndex = themes.indexOf(app);
  if (appIndex != undefined) {
    themes.splice(appIndex, 1);
    
    localStorage.setItem("themes", JSON.stringify(themes));
    await reloadThemes();
  } else {
    throw "app does not exist at";
  }
}

async function promptInstallTheme(url) {
  let response = await fetch(url, {cache: "reload", mode: "cors",});

	if (response.ok) {
    let style = await response.text();
    let title = style.match(/^\/\*theme title: ([^\n]+)\*\/$/m)[1];
    let desc = style.match(/^\/\*theme desc: ([^\n]+)\*\/$/m);

    var prompt = document.getElementById("clockwork-prmpt").cloneNode(true);
    prompt.id = "installthemeprompt-"+(Math.ceil(Math.random()*9999999));
    prompt.className = "clockwork-panel clockwork-panel-fadein";

    prompt.querySelector(".prmpt-title").innerHTML = `Theme installation confirmation`;
    prompt.querySelector(".prmpt-text").innerHTML = `Are you sure you want to install ${title}?`;
    prompt.querySelector(".prmpt-yes").onclick = function() {
      installTheme(url);
      prompt.className = "clockwork-panel clockwork-panel-fadeout";
      setTimeout(function() {prompt.style = "display: none;"}, 300)
    }
    prompt.querySelector(".prmpt-no").onclick = function() {
      prompt.className = "clockwork-panel clockwork-panel-fadeout";
      setTimeout(function() {prompt.style = "display: none;"}, 300)
    }
    
    prompt.style = "";

    document.body.appendChild(prompt);
  } else {
    var retry = confirm("HTTP error while getting theme data: " + response.status + "\nTheme url: "+url+"\nRetry?");
    if (retry == true) {
      promptInstallApp(url, params);
    }
  }
}

// settings
function changeSetting(setting, value) {
  alert("settings."+setting+" = "+value)
  if (eval("settings."+setting+" == true")) {
    if (typeof value == "string") {
      var text = "settings."+setting+" = '"+value+"'";
      eval(text)
    } else {
      var text = "settings."+setting+" = "+value;
      eval(text)
    }
    alert(JSON.stringify(settings));
    localStorage.setItem("settings", JSON.stringify(settings));
  }
}

// some stuff for passcodes
const pcodeInput = document.getElementById("passcode");

pcodeInput.oninput = function() {
  if (pcodeInput.value.length == 4) {
    if (pcodeInput.value == settings.lock.passcode) {
      document.getElementById("clockwork-lock").className = "clockwork-panel clockwork-panel-fadeout";
      document.getElementById("clockwork-content").style = "";
      setTimeout(function() {document.getElementById("clockwork-lock").style = "display: none;"}, 300)
    } else {
      pcodeInput.value = "";
    }
  }
};

function passcodeSettingChange(set) {
  if (false == settings.lock.enabled || (document.getElementById("cpc").value == settings.lock.passcode && true == settings.lock.enabled)) {
    if (set == 'change') {
      if (document.getElementById("npc1").value == document.getElementById("npc2").value) {
        settings.lock.passcode = document.getElementById("npc1").value;
        settings.lock.enabled = true;
        localStorage.setItem('settings', JSON.stringify(settings));
        alert("Success!")
      }
    } else if (set == 'remove') {
      settings.lock.passcode = "0000";
      settings.lock.enabled = false;
      localStorage.setItem('settings', JSON.stringify(settings));
      alert("Success!")
    }
  } else {
    alert("Passcode incorrect.");
  }
}
// notification system
const notificationPanel = document.getElementById("clockwork-notification-panel");
notificationPanel.className = "";

//onclick
document.querySelector("body").addEventListener("click", (event) => {
  contextMenu.className = "invisible";
  setTimeout(function() {
    contextMenu.style.display = "none";
  }, 250);
  if (!notificationPanel.contains(event.target.offsetParent) && notificationPanel.className == "visible") {
    openNotificationPanel();
  }
})

//more notif sys

function sendNotification(title, content) {
  let el = document.createElement("DIV");
  el.className = "clockwork-notification";
  el.innerHTML = `<b>${title}</b><br>\n${content}`;
  document.body.appendChild(el);
  setTimeout(function() {
    el.className = "clockwork-notification hide";
  }, 5000);
  setTimeout(function() {
    el.remove();
  }, 5500);
  if (document.getElementById("clockwork-notification-items").innerText == "You're all caught up!") {
    document.getElementById("clockwork-notification-items").innerHTML = "";
  }
  document.getElementById("clockwork-notification-items").innerHTML += `<div><b>${title} <img src="https://redstonenw.vercel.app/assets/clockwork/close.png" 
  onclick="notifDestroy(this);"></b>\n${content}</div>`;
  if (!notifPanelOpen) {
    document.getElementById("appsidebar:notifs").src = "https://redstonenw.vercel.app/assets/clockwork/new-notifs.png"
  }
}

var notifPanelOpen = false;
function openNotificationPanel() {
  console.log(notificationPanel.className);
  if (notifPanelOpen == false) {
    setTimeout(function(){
      notificationPanel.className = "visible";
      console.log(notificationPanel.className);
    },10)
    document.getElementById("appsidebar:notifs").src = "https://redstonenw.vercel.app/assets/clockwork/notifs.png"
    notifPanelOpen = true;
  } else {
    notificationPanel.className = "invisible";
    notifPanelOpen = false;
  }
}

function notifDestroy(me) {
  me.parentNode.parentNode.className = "hide";
  setTimeout(() => {
    if (me.parentNode.parentNode.parentNode.children.length == 1) {
      me.parentNode.parentNode.parentNode.innerHTML = "You're all caught up!"
    } else {
      me.parentNode.parentNode.remove();
    }
  }, 500);
}

function clearAllNotifs() {
  var stuff = document.querySelector("#clockwork-notification-items").children;
  for(let item of stuff) {
    item.className = "hide";
    setTimeout(() => {
      if (item.parentNode.parentNode.parentNode.children.length == 1) {
        item.parentNode.innerHTML = "You're all caught up!"
      } else {
        item.remove();
      }
    }, 500);
  }
  setTimeout(() => {
    document.querySelector("#clockwork-notification-items").innerHTML = "You're all caught up!"
  }, 750);
}

// clockwork.js functions
window.addEventListener('message', function(event) {
  if (event.data.length > 1) {
    if (event.data[0] == "installApp") {
      // event.source.frameElement.id.slice(9)
      if (appData.find(function(o) {
        return o.url == event.data[3]
      }).permissions.includes("installApp")) {
        if (event.data[1] == "installApp") {
          promptInstallApp(event.data[2], {})
        }
      }
    }
    if (event.data[0] == "installTheme") {
      // event.source.frameElement.id.slice(9)
      if (appData.find(function(o) {
        return o.url == event.data[3]
      }).permissions.includes("installTheme")) {
        if (event.data[1] == "installTheme") {
          promptInstallTheme(event.data[2])
        }
      }
    }
    if (event.data[0] == "notifications") {
      // event.source.frameElement.id.slice(9)
      var app = appData.find(function(o) {
        return o.url == event.data[3]
      });
      if (app.permissions.includes("notifications")) {
        if (event.data[1] == "sendNotification") {
          sendNotification(app.name, event.data[2]);
        }
      }
    }
  }
});

// onkeypress

document.body.onkeydown = function(e) { 
  if (e.key == "/") {
    e.preventDefault();
    finder.style = "display: block;"
    finderBox.style = "display: block;"
  }
};

// finder system
function checkFinder(str) {
  var match = [];
  for (let i=0; i<searchables.length;) {
    for (let i2=0; i2<searchables[i].searchText.length;) {
      var sub = str.slice(0, str.length)
      if (searchables[i].searchText[i2].includes(sub)) {
        match.push(searchables[i]);
        break;
      }
      ++i2;
    }
    ++i;
  }
  finderBox.innerHTML = "";
  for (let i=0; i<match.length&&i<12;) {
    var div = document.createElement("div");
    div.innerHTML = match[i].name

    // holy fucking shit WORK DAMN YOU
    // never have i been so inclined to inflict such violence onto a piece of code before
    // fucking hell
    
    var func = match[i].onclick;
    div.addEventListener("click", func);
    div.addEventListener("click", function() {
      finder.style = "display: none;";
      finderBox.style = "display: none;";
    });
    finderBox.appendChild(div);
    ++i;
  }
  if (finderBox.innerHTML == "") {
    finderBox.innerHTML = "No results - try a less specific search"
  }
}
finder.oninput = function() {
  try {
    checkFinder(this.value);
  } catch (e) {
    alert(e);
  }
}
try {
  checkFinder("ap")
} catch (e) {
  alert("ERROR");
  alert(e);
}