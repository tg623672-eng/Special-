/* SK Host custom addition: modules, footer removal, kill button & sidebar tweaks */
console.log("skahost#~ nebulaModules.js")

var NEBULA_MODULES = [
  { key: "plugin_installer", slug: "plugins", label: "Plugin Manager", icon: "bi-plug-fill", scope: "server", type: "files", dir: "/plugins", accept: ".jar", desc: "Upload, enable/disable and remove plugins on this server." },
  { key: "player_manager", slug: "players", label: "Player Manager", icon: "bi-people-fill", scope: "server", type: "players", desc: "View the online players and run player commands on this server." },
  { key: "mod_installer", slug: "mods", label: "Mod Installer", icon: "bi-box-seam-fill", scope: "server", type: "files", dir: "/mods", accept: ".jar", desc: "Upload and remove mods on this server." },
  { key: "version_changer", slug: "version", label: "Version Changer (Java)", icon: "bi-cup-hot-fill", scope: "server", type: "startup", desc: "Change the Java server version through the startup variables." },
  { key: "bedrock_addon_installer", slug: "bedrock-addons", label: "Bedrock Addon Installer", icon: "bi-boxes", scope: "server", type: "files", dir: "/behavior_packs", accept: ".mcpack,.mcaddon,.zip", desc: "Install Bedrock add-ons (behaviour/resource packs)." },
  { key: "subdomain_manager", slug: "subdomains", label: "Subdomain Manager", icon: "bi-globe2", scope: "server", type: "network", desc: "Review the allocations and connection addresses for this server." },
  { key: "bedrock_version_changer", slug: "bedrock-version", label: "Bedrock Version Changer", icon: "bi-arrow-repeat", scope: "server", type: "startup", desc: "Change the Bedrock server version through the startup variables." },
  { key: "server_splitters", slug: "splitters", label: "Server Splitters", icon: "bi-diagram-3-fill", scope: "server", type: "network", desc: "Review the allocations available to split across this server." },
  { key: "properties_manager", slug: "properties", label: "Properties Manager", icon: "bi-sliders", scope: "server", type: "properties", desc: "Edit this server's server.properties settings." },
  { key: "world_manager", slug: "worlds", label: "World Manager", icon: "bi-map-fill", scope: "server", type: "files", dir: "/worlds", accept: ".zip,.mcworld", desc: "Manage and upload the worlds on this server." },
  { key: "world_installer", slug: "world-installer", label: "World Installer", icon: "bi-download", scope: "server", type: "files", dir: "/", accept: ".zip,.mcworld,.tar,.gz", desc: "Upload pre-made worlds onto this server." },
  { key: "auto_suspension", slug: "billing", label: "Auto Suspension", icon: "bi-credit-card-2-front-fill", scope: "account", type: "billing", desc: "Review your servers' auto-suspension status and expiry dates." },
]

function nebulaUiConfig() {
  return (window.NebulaConfig && window.NebulaConfig.ui) || {}
}

function nebulaModuleEnabled(key) {
  var modules = (window.NebulaConfig && window.NebulaConfig.modules) || {}
  return modules[key] === true
}

function nebulaAutoSuspendConfig() {
  return (window.NebulaConfig && window.NebulaConfig.autoSuspend) || { enabled: false, expiry: {} }
}

/* ---- API helpers ---- */
function nebulaXsrfToken() {
  var match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ""
}

function nebulaApi(method, path, body) {
  var options = {
    method: method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": nebulaXsrfToken(),
    },
  }
  if (body !== undefined && body !== null) {
    options.headers["Content-Type"] = "application/json"
    options.body = JSON.stringify(body)
  }
  return fetch(path, options).then(function (response) {
    if (response.status === 204) return {}
    return response.text().then(function (text) {
      var data = {}
      try { data = text ? JSON.parse(text) : {} } catch (e) { data = {} }
      if (!response.ok) {
        var message = "Request failed (" + response.status + ")."
        try {
          if (data && data.errors && data.errors[0] && data.errors[0].detail) message = data.errors[0].detail
        } catch (e2) {}
        throw new Error(message)
      }
      return data
    })
  })
}

function nebulaServerFilesBase() {
  var id = typeof fetchServerId === "function" ? fetchServerId() : null
  return id ? "/api/client/servers/" + id : null
}

/* Upload one binary file into a server directory using Wings' signed upload URL. */
function nebulaUploadFile(directory, file) {
  var base = nebulaServerFilesBase()
  if (!base) return Promise.reject(new Error("No server selected."))
  return nebulaApi("GET", base + "/files/upload").then(function (data) {
    var url = data && data.attributes && data.attributes.url
    if (!url) throw new Error("Could not obtain an upload URL.")
    var target = url + "&directory=" + encodeURIComponent(directory)
    var form = new FormData()
    form.append("files", file)
    return fetch(target, { method: "POST", credentials: "include", body: form }).then(function (r) {
      if (!r.ok) throw new Error("Upload failed (" + r.status + ").")
      return true
    })
  })
}

/* ---- 1. Footer removal (Pterodactyl copyright) ---- */
function nebulaRemoveFooter() {
  if (!nebulaUiConfig().removeFooter) return
  document.querySelectorAll('a[href^="https://pterodactyl.io"]').forEach(function (link) {
    var paragraph = link.closest("p")
    var container = paragraph ? paragraph.parentElement : link.parentElement
    if (container) container.style.display = "none"
  })
}

/* ---- 2. Server console "Kill" button ---- */
function nebulaSendKill() {
  var id = typeof fetchServerId === "function" ? fetchServerId() : null
  if (!id) return
  nebulaApi("POST", "/api/client/servers/" + id + "/power", { signal: "kill" }).catch(function () {})
}

function nebulaAddKillButton() {
  if (nebulaUiConfig().consoleKillButton === false) return
  if (typeof nebulaCurrentPage === "function" && nebulaCurrentPage() !== "serverTerminal") return
  if (document.querySelector(".nebula-kill-button")) return

  var powerButton = null
  document.querySelectorAll("button").forEach(function (button) {
    var text = (button.textContent || "").trim()
    if (!powerButton && (text === "Stop" || text === "Restart" || text === "Start")) {
      powerButton = button
    }
  })
  if (!powerButton) return

  var kill = powerButton.cloneNode(true)
  kill.classList.add("nebula-kill-button")
  kill.textContent = "Kill"
  kill.removeAttribute("disabled")
  kill.disabled = false
  kill.addEventListener("click", function (event) {
    event.preventDefault()
    event.stopPropagation()
    nebulaSendKill()
  })
  powerButton.parentNode.appendChild(kill)
}

/* ---- 3. Never present extensions behind the 3-dot "more" dropdown ---- */
function nebulaHideExtensionThreeDot() {
  // Extensions are always shown as a permanent sidebar list; the 3-dot "more"
  // dropdown is never used for them.
  ;["sidebarAccountMore", "sidebarServerMore"].forEach(function (id) {
    var el = document.getElementById(id)
    if (el) el.style.display = "none"
  })
}

/* ---- 4. Module view framework ---- */
function nebulaEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  })
}

function nebulaCloseModule() {
  var existing = document.querySelector(".nebula-module-view")
  if (existing) existing.remove()
}

function nebulaOpenModule(module) {
  var host =
    document.querySelector(".App___StyledDiv-sc-2l91w7-0") ||
    document.querySelector("#app") ||
    document.body
  nebulaCloseModule()

  var view = document.createElement("div")
  view.className = "nebula-module-view"
  view.innerHTML =
    '<div class="nebula-module-card">' +
    '<div class="nebula-module-head"><i class="bi ' + nebulaEscape(module.icon) + '"></i><span>' + nebulaEscape(module.label) + "</span>" +
    '<button class="nebula-module-close" title="Close"><i class="bi bi-x-lg"></i></button></div>' +
    '<p class="nebula-module-desc">' + nebulaEscape(module.desc || "") + "</p>" +
    '<div class="nebula-module-content"><div class="nebula-module-loading">Loading…</div></div>' +
    "</div>"

  view.querySelector(".nebula-module-close").addEventListener("click", nebulaCloseModule)
  view.addEventListener("click", function (event) {
    if (event.target === view) nebulaCloseModule()
  })
  host.appendChild(view)

  var content = view.querySelector(".nebula-module-content")
  try {
    nebulaRenderModule(module, content)
  } catch (e) {
    nebulaModuleError(content, e && e.message ? e.message : "This module could not be opened.")
  }
}

function nebulaModuleError(content, message) {
  content.innerHTML = '<div class="nebula-module-msg nebula-module-msg-error"><i class="bi bi-exclamation-triangle"></i> ' + nebulaEscape(message) + "</div>"
}

function nebulaModuleInfo(content, message) {
  content.innerHTML = '<div class="nebula-module-msg"><i class="bi bi-info-circle"></i> ' + nebulaEscape(message) + "</div>"
}

function nebulaRenderModule(module, content) {
  switch (module.type) {
    case "files":
      return nebulaRenderFilesModule(module, content)
    case "players":
      return nebulaRenderPlayersModule(module, content)
    case "properties":
      return nebulaRenderPropertiesModule(module, content)
    case "startup":
      return nebulaRenderStartupModule(module, content)
    case "network":
      return nebulaRenderNetworkModule(module, content)
    case "billing":
      return nebulaRenderBillingModule(module, content)
    default:
      return nebulaModuleInfo(content, module.desc || "This module is enabled for your account.")
  }
}

/* ---- File-based modules (plugins, mods, worlds, bedrock addons) ---- */
function nebulaRenderFilesModule(module, content) {
  var base = nebulaServerFilesBase()
  if (!base) return nebulaModuleError(content, "Open this from a server to manage its files.")

  content.innerHTML =
    '<div class="nebula-module-toolbar">' +
    '<label class="nebula-module-btn"><i class="bi bi-upload"></i> Upload' +
    '<input type="file" class="nebula-hidden-file"' + (module.accept ? ' accept="' + nebulaEscape(module.accept) + '"' : "") + " multiple></label>" +
    '<button class="nebula-module-btn nebula-refresh"><i class="bi bi-arrow-clockwise"></i> Refresh</button>' +
    '<span class="nebula-module-dir">' + nebulaEscape(module.dir) + "</span>" +
    "</div>" +
    '<div class="nebula-module-status"></div>' +
    '<div class="nebula-module-list"><div class="nebula-module-loading">Loading…</div></div>'

  var list = content.querySelector(".nebula-module-list")
  var status = content.querySelector(".nebula-module-status")
  var fileInput = content.querySelector(".nebula-hidden-file")

  function setStatus(message, isError) {
    status.className = "nebula-module-status" + (isError ? " nebula-module-msg-error" : "")
    status.textContent = message || ""
  }

  function load() {
    list.innerHTML = '<div class="nebula-module-loading">Loading…</div>'
    nebulaApi("GET", base + "/files/list?directory=" + encodeURIComponent(module.dir))
      .then(function (data) {
        var items = (data && data.data) || []
        if (!items.length) {
          list.innerHTML = '<div class="nebula-module-msg"><i class="bi bi-inbox"></i> This directory is empty.</div>'
          return
        }
        var rows = items
          .map(function (item) {
            var a = item.attributes || {}
            var disabled = /\.disabled$/.test(a.name)
            return (
              '<div class="nebula-file-row" data-name="' + nebulaEscape(a.name) + '">' +
              '<i class="bi ' + (a.is_file ? "bi-file-earmark" : "bi-folder") + '"></i>' +
              '<span class="nebula-file-name">' + nebulaEscape(a.name) + (disabled ? ' <em>(disabled)</em>' : "") + "</span>" +
              (a.is_file
                ? '<button class="nebula-file-toggle nebula-mini-btn" title="Enable/disable">' + (disabled ? "Enable" : "Disable") + "</button>"
                : "") +
              '<button class="nebula-file-delete nebula-mini-btn nebula-danger" title="Delete"><i class="bi bi-trash"></i></button>' +
              "</div>"
            )
          })
          .join("")
        list.innerHTML = rows
      })
      .catch(function (e) {
        // The target directory may not exist yet (e.g. a fresh server with no
        // /plugins folder). Rather than surfacing an alarming error, show a
        // friendly empty state — uploading the first file creates the folder.
        nebulaModuleInfo(list, "This directory doesn't exist yet. Upload a file to create it.")
      })
  }

  list.addEventListener("click", function (event) {
    var row = event.target.closest(".nebula-file-row")
    if (!row) return
    var name = row.getAttribute("data-name")
    if (event.target.closest(".nebula-file-delete")) {
      if (!window.confirm("Delete " + name + "?")) return
      setStatus("Deleting " + name + "…")
      nebulaApi("POST", base + "/files/delete", { root: module.dir, files: [name] })
        .then(function () { setStatus(name + " deleted."); load() })
        .catch(function (e) { setStatus(e.message, true) })
    } else if (event.target.closest(".nebula-file-toggle")) {
      var to = /\.disabled$/.test(name) ? name.replace(/\.disabled$/, "") : name + ".disabled"
      setStatus("Updating " + name + "…")
      nebulaApi("PUT", base + "/files/rename", { root: module.dir, files: [{ from: name, to: to }] })
        .then(function () { setStatus(name + " updated."); load() })
        .catch(function (e) { setStatus(e.message, true) })
    }
  })

  fileInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(fileInput.files || [])
    if (!files.length) return
    setStatus("Uploading " + files.length + " file(s)…")
    var chain = Promise.resolve()
    files.forEach(function (file) {
      chain = chain.then(function () { return nebulaUploadFile(module.dir, file) })
    })
    chain
      .then(function () { setStatus("Upload complete."); fileInput.value = ""; load() })
      .catch(function (e) { setStatus(e.message, true) })
  })

  content.querySelector(".nebula-refresh").addEventListener("click", load)
  load()
}

/* ---- Player Manager ---- */
function nebulaRenderPlayersModule(module, content) {
  var id = typeof fetchServerId === "function" ? fetchServerId() : null
  if (!id) return nebulaModuleError(content, "Open this from a server to manage its players.")

  var counts = (window.NebulaConfig && window.NebulaConfig.players && window.NebulaConfig.players.counts) || {}
  var online = Object.prototype.hasOwnProperty.call(counts, id) ? counts[id] : null

  content.innerHTML =
    '<div class="nebula-module-msg">' +
    '<i class="bi bi-people-fill"></i> ' +
    (online === null ? "Player count unavailable (enable the player count feature)." : online + " player(s) currently online.") +
    "</div>" +
    '<div class="nebula-player-actions">' +
    '<button class="nebula-module-btn" data-cmd="list"><i class="bi bi-list-ul"></i> List players</button>' +
    "</div>" +
    '<div class="nebula-player-form">' +
    '<input type="text" class="nebula-input nebula-player-target" placeholder="Player name">' +
    '<button class="nebula-mini-btn" data-cmd="kick">Kick</button>' +
    '<button class="nebula-mini-btn" data-cmd="ban">Ban</button>' +
    '<button class="nebula-mini-btn" data-cmd="op">Op</button>' +
    '<button class="nebula-mini-btn" data-cmd="deop">Deop</button>' +
    "</div>" +
    '<div class="nebula-player-form">' +
    '<input type="text" class="nebula-input nebula-player-command" placeholder="Custom console command (e.g. say Hello)">' +
    '<button class="nebula-mini-btn nebula-player-run">Run</button>' +
    "</div>" +
    '<p class="nebula-module-hint">Commands are sent to the server console and require the server to be running. Output appears in the Terminal tab.</p>' +
    '<div class="nebula-module-status"></div>'

  var status = content.querySelector(".nebula-module-status")
  function setStatus(message, isError) {
    status.className = "nebula-module-status" + (isError ? " nebula-module-msg-error" : "")
    status.textContent = message || ""
  }
  function send(command) {
    if (!command) return
    setStatus("Sending: " + command)
    nebulaApi("POST", "/api/client/servers/" + id + "/command", { command: command })
      .then(function () { setStatus("Sent: " + command) })
      .catch(function (e) { setStatus(e.message + " (is the server running?)", true) })
  }

  content.querySelectorAll(".nebula-player-actions [data-cmd]").forEach(function (btn) {
    btn.addEventListener("click", function () { send(btn.getAttribute("data-cmd")) })
  })
  content.querySelectorAll(".nebula-player-form [data-cmd]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = (content.querySelector(".nebula-player-target").value || "").trim()
      if (!target) { setStatus("Enter a player name first.", true); return }
      send(btn.getAttribute("data-cmd") + " " + target)
    })
  })
  content.querySelector(".nebula-player-run").addEventListener("click", function () {
    send((content.querySelector(".nebula-player-command").value || "").trim())
  })
}

/* ---- Properties Manager (server.properties key/value editor) ---- */
function nebulaRenderPropertiesModule(module, content) {
  var base = nebulaServerFilesBase()
  if (!base) return nebulaModuleError(content, "Open this from a server to edit its properties.")

  content.innerHTML = '<div class="nebula-module-loading">Loading server.properties…</div>'
  fetch(base + "/files/contents?file=" + encodeURIComponent("/server.properties"), {
    credentials: "include",
    headers: { Accept: "text/plain", "X-XSRF-TOKEN": nebulaXsrfToken() },
  })
    .then(function (r) {
      if (!r.ok) throw new Error("Could not read server.properties (" + r.status + ").")
      return r.text()
    })
    .then(function (text) {
      content.innerHTML =
        '<textarea class="nebula-input nebula-props-area" spellcheck="false"></textarea>' +
        '<div class="nebula-module-toolbar"><button class="nebula-module-btn nebula-props-save"><i class="bi bi-save"></i> Save</button></div>' +
        '<div class="nebula-module-status"></div>'
      content.querySelector(".nebula-props-area").value = text
      var status = content.querySelector(".nebula-module-status")
      content.querySelector(".nebula-props-save").addEventListener("click", function () {
        var value = content.querySelector(".nebula-props-area").value
        status.className = "nebula-module-status"
        status.textContent = "Saving…"
        fetch(base + "/files/write?file=" + encodeURIComponent("/server.properties"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "text/plain", "X-XSRF-TOKEN": nebulaXsrfToken() },
          body: value,
        })
          .then(function (r) {
            if (!r.ok) throw new Error("Save failed (" + r.status + ").")
            status.textContent = "Saved. Restart the server to apply."
          })
          .catch(function (e) {
            status.className = "nebula-module-status nebula-module-msg-error"
            status.textContent = e.message
          })
      })
    })
    .catch(function (e) {
      nebulaModuleError(content, e.message)
    })
}

/* ---- Startup / version modules (edit startup variables) ---- */
function nebulaRenderStartupModule(module, content) {
  var id = typeof fetchServerId === "function" ? fetchServerId() : null
  if (!id) return nebulaModuleError(content, "Open this from a server to change its version.")

  content.innerHTML = '<div class="nebula-module-loading">Loading startup variables…</div>'
  nebulaApi("GET", "/api/client/servers/" + id + "/startup")
    .then(function (data) {
      var vars = (data && data.data) || []
      if (!vars.length) return nebulaModuleInfo(content, "This server has no editable startup variables.")
      var rows = vars
        .map(function (item) {
          var a = item.attributes || {}
          if (a.is_editable === false) return ""
          return (
            '<div class="nebula-var-row" data-key="' + nebulaEscape(a.env_variable) + '">' +
            '<label class="nebula-var-label">' + nebulaEscape(a.name || a.env_variable) + "</label>" +
            '<input class="nebula-input nebula-var-input" value="' + nebulaEscape(a.server_value == null ? "" : a.server_value) + '">' +
            '<button class="nebula-mini-btn nebula-var-save">Save</button>' +
            "</div>"
          )
        })
        .join("")
      content.innerHTML =
        '<p class="nebula-module-hint">Change the version by editing the relevant variable (e.g. version / build). Restart the server to apply.</p>' +
        rows + '<div class="nebula-module-status"></div>'
      var status = content.querySelector(".nebula-module-status")
      content.querySelectorAll(".nebula-var-save").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var row = btn.closest(".nebula-var-row")
          var key = row.getAttribute("data-key")
          var value = row.querySelector(".nebula-var-input").value
          status.className = "nebula-module-status"
          status.textContent = "Saving " + key + "…"
          nebulaApi("PUT", "/api/client/servers/" + id + "/startup/variable", { key: key, value: value })
            .then(function () { status.textContent = key + " saved. Restart to apply." })
            .catch(function (e) {
              status.className = "nebula-module-status nebula-module-msg-error"
              status.textContent = e.message
            })
        })
      })
    })
    .catch(function (e) {
      nebulaModuleError(content, e.message)
    })
}

/* ---- Network / allocation review modules ---- */
function nebulaRenderNetworkModule(module, content) {
  var id = typeof fetchServerId === "function" ? fetchServerId() : null
  if (!id) return nebulaModuleError(content, "Open this from a server to review its network.")

  content.innerHTML = '<div class="nebula-module-loading">Loading allocations…</div>'
  nebulaApi("GET", "/api/client/servers/" + id + "/network/allocations")
    .then(function (data) {
      var items = (data && data.data) || []
      if (!items.length) return nebulaModuleInfo(content, "No allocations are assigned to this server.")
      var rows = items
        .map(function (item) {
          var a = item.attributes || {}
          var address = (a.ip_alias || a.ip) + ":" + a.port
          return (
            '<div class="nebula-file-row">' +
            '<i class="bi bi-hdd-network"></i>' +
            '<span class="nebula-file-name">' + nebulaEscape(address) + (a.is_default ? " <em>(primary)</em>" : "") + (a.notes ? " — " + nebulaEscape(a.notes) : "") + "</span>" +
            "</div>"
          )
        })
        .join("")
      content.innerHTML = '<p class="nebula-module-hint">' + nebulaEscape(module.desc) + "</p>" + rows
    })
    .catch(function (e) {
      nebulaModuleError(content, e.message)
    })
}

/* ---- Auto Suspension / billing overview (account scope) ---- */
function nebulaRenderBillingModule(module, content) {
  var cfg = nebulaAutoSuspendConfig()
  var expiry = cfg.expiry || {}
  var keys = Object.keys(expiry)
  if (!cfg.enabled) return nebulaModuleInfo(content, "Auto-suspension is not enabled on this panel.")
  if (!keys.length) return nebulaModuleInfo(content, "None of your servers currently have an expiry date set.")

  var rows = keys
    .map(function (id) {
      var when = expiry[id]
      var ts = Date.parse(when)
      var remaining = isNaN(ts) ? "" : nebulaFormatCountdown(ts - Date.now())
      return (
        '<div class="nebula-file-row">' +
        '<i class="bi bi-hourglass-split"></i>' +
        '<span class="nebula-file-name">' + nebulaEscape(id) + " — expires " + nebulaEscape(when) + (remaining ? " (" + remaining + ")" : "") + "</span>" +
        "</div>"
      )
    })
    .join("")
  content.innerHTML = '<p class="nebula-module-hint">' + nebulaEscape(module.desc) + "</p>" + rows
}

function nebulaFormatCountdown(ms) {
  if (ms <= 0) return "expired"
  var s = Math.floor(ms / 1000)
  var d = Math.floor(s / 86400); s -= d * 86400
  var h = Math.floor(s / 3600); s -= h * 3600
  var m = Math.floor(s / 60)
  if (d > 0) return d + "d " + h + "h"
  if (h > 0) return h + "h " + m + "m"
  return m + "m"
}

/* ---- Module navigation (permanent list, no 3-dot dropdown) ---- */
function nebulaBuildModuleNav() {
  var page = typeof nebulaCurrentPage === "function" ? nebulaCurrentPage() : ""
  var scope = page && page.indexOf("server") === 0 ? "server" : page === "home" || (page && page.indexOf("account") === 0) ? "account" : null
  if (!scope) return

  var nav = document.querySelector("#SubNavigation div")
  if (!nav) return
  if (nav.querySelector(".nebula-module-tab")) return

  var anyEnabled = NEBULA_MODULES.some(function (module) {
    return module.scope === scope && nebulaModuleEnabled(module.key)
  })
  if (anyEnabled && !nav.querySelector(".nebula-ext-header")) {
    var header = document.createElement("div")
    header.className = "nebula-ext-header"
    header.textContent = "EXTENSIONS"
    nav.appendChild(header)
  }

  NEBULA_MODULES.forEach(function (module) {
    if (module.scope !== scope) return
    if (!nebulaModuleEnabled(module.key)) return

    var tab = document.createElement("a")
    tab.className = "nebula-module-tab"
    tab.href = "#nebula/" + module.slug
    tab.innerHTML = '<i class="bi ' + module.icon + '"></i> ' + module.label
    tab.addEventListener("click", function (event) {
      event.preventDefault()
      nebulaOpenModule(module)
    })
    nav.appendChild(tab)
  })
}

/* ---- 5. Server card background image ---- */
function nebulaApplyCardBackground() {
  var url = nebulaUiConfig().serverCardBackground
  if (url) {
    document.documentElement.style.setProperty("--nebula-card-bg", 'url("' + url + '")')
  }
}

/* ---- 6. Per-egg card images ---- */
function nebulaApplyEggImages() {
  var cfg = (window.NebulaConfig && window.NebulaConfig.eggImages) || { enabled: false, servers: {} }
  if (!cfg.enabled) return
  if (typeof nebulaCurrentPage === "function" && nebulaCurrentPage() !== "home") return
  var servers = cfg.servers || {}
  document.querySelectorAll('a[href^="/server/"]').forEach(function (card) {
    var match = card.getAttribute("href").match(/\/server\/([^/]+)/)
    if (!match) return
    var url = servers[match[1]]
    if (!url) return
    if (card.querySelector(".nebula-egg-image")) return
    var img = document.createElement("div")
    img.className = "nebula-egg-image"
    img.style.backgroundImage = 'url("' + url + '")'
    card.appendChild(img)
  })
}

/* ---- 7. Per-card info line: active players + auto-suspend countdown ---- */
function nebulaApplyServerCardInfo() {
  if (typeof nebulaCurrentPage === "function" && nebulaCurrentPage() !== "home") return
  var playersCfg = (window.NebulaConfig && window.NebulaConfig.players) || { enabled: false, counts: {} }
  var suspendCfg = nebulaAutoSuspendConfig()
  if (!playersCfg.enabled && !suspendCfg.enabled) return
  var counts = playersCfg.counts || {}
  var expiry = suspendCfg.expiry || {}

  document.querySelectorAll('a[href^="/server/"]').forEach(function (card) {
    var match = card.getAttribute("href").match(/\/server\/([^/]+)/)
    if (!match) return
    var id = match[1]

    var hasPlayers = playersCfg.enabled && Object.prototype.hasOwnProperty.call(counts, id)
    var hasExpiry = suspendCfg.enabled && Object.prototype.hasOwnProperty.call(expiry, id)
    if (!hasPlayers && !hasExpiry) {
      var stale = card.querySelector(".nebula-card-info")
      if (stale) stale.remove()
      return
    }

    var info = card.querySelector(".nebula-card-info")
    if (!info) {
      info = document.createElement("div")
      info.className = "nebula-card-info"
      card.appendChild(info)
    }

    var parts = []
    if (hasPlayers) {
      var n = counts[id]
      parts.push('<span class="nebula-card-players"><i class="bi bi-people-fill"></i> ' + nebulaEscape(n) + (Number(n) === 1 ? " player" : " players") + "</span>")
    }
    if (hasExpiry) {
      var ts = Date.parse(expiry[id])
      var remaining = ts - Date.now()
      var expired = !isNaN(ts) && remaining <= 0
      var soon = !isNaN(ts) && remaining > 0 && remaining < 86400000
      var label = isNaN(ts) ? "\u2014" : nebulaFormatCountdown(remaining)
      var cls = "nebula-card-countdown" + (expired ? " nebula-card-expired" : soon ? " nebula-card-soon" : "")
      parts.push('<span class="' + cls + '"><i class="bi bi-hourglass-split"></i> ' + nebulaEscape(label) + "</span>")
    }
    info.innerHTML = parts.join("")
  })
}

function nebulaModulesRefresh() {
  try { nebulaApplyCardBackground() } catch (e) {}
  try { nebulaApplyEggImages() } catch (e) {}
  try { nebulaApplyServerCardInfo() } catch (e) {}
  try { nebulaRemoveFooter() } catch (e) {}
  try { nebulaAddKillButton() } catch (e) {}
  try { nebulaHideExtensionThreeDot() } catch (e) {}
  try { nebulaBuildModuleNav() } catch (e) {}
}

window.addEventListener("locationchange", function () {
  nebulaCloseModule()
  nebulaModulesRefresh()
})
window.addEventListener("load", function () {
  nebulaModulesRefresh()
  setInterval(nebulaModulesRefresh, 1000)
})
