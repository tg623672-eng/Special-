/* SK Host custom addition: Idle Server Shutdown (Auto-Sleep) & player counts — frontend */
console.log("skhost#~ idleShutdown.js")

function nebulaIdleConfig() {
  return (window.NebulaConfig && window.NebulaConfig.idleShutdown) || { enabled: false, sleeping: [] }
}

function nebulaIsSleeping(id) {
  if (!id) return false
  var cfg = nebulaIdleConfig()
  return (cfg.sleeping || []).indexOf(id) !== -1
}

/* Dashboard: mark sleeping server cards with a purple/blue "Sleeping" badge. */
function nebulaRefreshSleepingCards() {
  var cfg = nebulaIdleConfig()
  if (!cfg.enabled) return
  if (typeof nebulaCurrentPage === "function" && nebulaCurrentPage() !== "home") return

  document.querySelectorAll('a[href^="/server/"]').forEach(function (card) {
    var match = card.getAttribute("href").match(/\/server\/([^/]+)/)
    if (!match) return
    var id = match[1]

    if (!nebulaIsSleeping(id)) {
      card.removeAttribute("nebula-sleeping")
      var stale = card.querySelector(".nebula-sleep-badge")
      if (stale) stale.remove()
      return
    }

    card.setAttribute("nebula-sleeping", "true")
    if (!card.querySelector(".nebula-sleep-badge")) {
      var badge = document.createElement("div")
      badge.className = "nebula-sleep-badge"
      badge.innerHTML = "\uD83C\uDF19 Sleeping"
      card.appendChild(badge)
    }
  })
}

/* Server view: show an inactivity banner when the current server is sleeping. */
function nebulaRefreshSleepingBanner() {
  var cfg = nebulaIdleConfig()
  var page = typeof nebulaCurrentPage === "function" ? nebulaCurrentPage() : ""
  var id = typeof fetchServerId === "function" ? fetchServerId() : null
  var existing = document.querySelector(".nebula-sleep-banner")
  var onServer = page && page.indexOf("server") === 0

  if (!cfg.enabled || !onServer || !nebulaIsSleeping(id)) {
    if (existing) existing.remove()
    return
  }
  if (existing) return

  var banner = document.createElement("div")
  banner.className = "nebula-sleep-banner"
  banner.innerHTML =
    '<span class="nebula-sleep-banner-icon">\uD83C\uDF19</span> Server was stopped due to inactivity. Click <b>Start</b> to wake it up.'

  try {
    var app = document.querySelector(".App___StyledDiv-sc-2l91w7-0")
    if (app && app.parentNode) {
      app.parentNode.insertBefore(banner, app)
    } else {
      document.body.insertBefore(banner, document.body.firstChild)
    }
  } catch (e) {
    document.body.appendChild(banner)
  }
}

/* Dashboard: show the active player count below each server card. */
function nebulaPlayersConfig() {
  return (window.NebulaConfig && window.NebulaConfig.players) || { enabled: false, counts: {} }
}

function nebulaRefreshPlayerCounts() {
  var cfg = nebulaPlayersConfig()
  if (!cfg.enabled) return
  if (typeof nebulaCurrentPage === "function" && nebulaCurrentPage() !== "home") return

  var counts = cfg.counts || {}
  document.querySelectorAll('a[href^="/server/"]').forEach(function (card) {
    var match = card.getAttribute("href").match(/\/server\/([^/]+)/)
    if (!match) return
    var id = match[1]

    if (!Object.prototype.hasOwnProperty.call(counts, id)) {
      var stale = card.querySelector(".nebula-card-players")
      if (stale) stale.remove()
      return
    }

    var count = counts[id]
    var label = card.querySelector(".nebula-card-players")
    if (!label) {
      label = document.createElement("div")
      label.className = "nebula-card-players"
      card.appendChild(label)
    }
    label.innerHTML =
      '<i class="bi bi-people-fill"></i> ' + count + (count === 1 ? " player online" : " players online")
  })
}

/* Dashboard: show an auto-suspend countdown below each server card. */
function nebulaAutoSuspendConfigLocal() {
  return (window.NebulaConfig && window.NebulaConfig.autoSuspend) || { enabled: false, expiry: {} }
}

function nebulaCountdownText(ms) {
  if (ms <= 0) return "Suspended (expired)"
  var s = Math.floor(ms / 1000)
  var d = Math.floor(s / 86400); s -= d * 86400
  var h = Math.floor(s / 3600); s -= h * 3600
  var m = Math.floor(s / 60); s -= m * 60
  var parts = []
  if (d > 0) parts.push(d + "d")
  if (h > 0 || d > 0) parts.push(h + "h")
  parts.push(m + "m")
  if (d === 0 && h === 0) parts.push(s + "s")
  return "Suspends in " + parts.join(" ")
}

function nebulaRefreshAutoSuspend() {
  var cfg = nebulaAutoSuspendConfigLocal()
  if (!cfg.enabled) return
  if (typeof nebulaCurrentPage === "function" && nebulaCurrentPage() !== "home") return

  var expiry = cfg.expiry || {}
  document.querySelectorAll('a[href^="/server/"]').forEach(function (card) {
    var match = card.getAttribute("href").match(/\/server\/([^/]+)/)
    if (!match) return
    var id = match[1]

    if (!Object.prototype.hasOwnProperty.call(expiry, id)) {
      var stale = card.querySelector(".nebula-card-expiry")
      if (stale) stale.remove()
      return
    }

    var ts = Date.parse(expiry[id])
    if (isNaN(ts)) return
    var label = card.querySelector(".nebula-card-expiry")
    if (!label) {
      label = document.createElement("div")
      label.className = "nebula-card-expiry"
      card.appendChild(label)
    }
    var remaining = ts - Date.now()
    label.classList.toggle("nebula-card-expiry-soon", remaining > 0 && remaining < 86400000)
    label.classList.toggle("nebula-card-expiry-expired", remaining <= 0)
    label.innerHTML = '<i class="bi bi-hourglass-split"></i> ' + nebulaCountdownText(remaining)
  })
}

function nebulaIdleRefresh() {
  try { nebulaRefreshSleepingCards() } catch (e) {}
  try { nebulaRefreshSleepingBanner() } catch (e) {}
  try { nebulaRefreshPlayerCounts() } catch (e) {}
  try { nebulaRefreshAutoSuspend() } catch (e) {}
}

window.addEventListener("locationchange", nebulaIdleRefresh)
window.addEventListener("load", function () {
  nebulaIdleRefresh()
  setInterval(nebulaIdleRefresh, 1000)
})
