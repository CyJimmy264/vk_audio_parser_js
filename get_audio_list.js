/*
  console.save_xspf
*/
(function (console) {

  console.save_xspf = function (data, filename) {

    if (!data) {
      console.error('Console.save: No data')
      return;
    }

    if (!filename) filename = 'console.json'

    if (typeof data === "object") {
      data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], { type: 'application/xspf' }),
      e = document.createEvent('MouseEvents'),
      a = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['application/xspf', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
  }
})(console)

/*
  VK Audio Url Decode
*/
var skip_scrolling = true;
var only_first_ten = true;
var id = 13370370;
var n = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=",
    i = {
      v: function(e) {
        return e.split("").reverse().join("")
      },
      r: function(e, t) {
        e = e.split("");
        for (var i, o = n + n, s = e.length; s--;) i = o.indexOf(e[s]), ~i && (e[s] = o.substr(i - t, 1));
        return e.join("")
      },
      s: function(e, t) {
        var n = e.length;
        if (n) {
          var i = r(e, t),
              o = 0;
          for (e = e.split(""); ++o < n;) e[o] = e.splice(i[n - 1 - o], 1, e[o])[0];
          e = e.join("")
        }
        return e
      },
      i: function(e, t) {
        return i.s(e, t ^ id)
      },
      x: function(e, t) {
        var n = [];
        return t = t.charCodeAt(0), each(e.split(""), function(e, i) {
          n.push(String.fromCharCode(i.charCodeAt(0) ^ t))
        }), n.join("")
      }
    };

function o() {
  return window.wbopen && ~(window.open + "").indexOf("wbopen")
}

function s(e) {
  if (!o() && e.includes("audio_api_unavailable") && e.includes("extra")) {
    var t = e.split("?extra=")[1].split("#"),
        n = "" === t[1] ? "" : a(t[1]);
    if (t = a(t[0]), "string" != typeof n || !t) return e;
    n = n ? n.split(String.fromCharCode(9)) : [];
    for (var s, r, l = n.length; l--;) {
      if (r = n[l].split(String.fromCharCode(11)), s = r.splice(0, 1, t)[0], !i[s]) return e;
      t = i[s].apply(null, r)
    }
    if (t && "http" === t.substr(0, 4)) return t
  }
  return e
}

function a(e) {
  if (!e || e.length % 4 == 1) return !1;
  for (var t, i, o = 0, s = 0, a = ""; i = e.charAt(s++);) i = n.indexOf(i), ~i && (t = o % 4 ? 64 * t + i : i, o++ % 4) && (a += String.fromCharCode(255 & t >> (-2 * o & 6)));
  return a
}

function r(e, t) {
  var n = e.length,
      i = [];
  if (n) {
    var o = n;
    for (t = Math.abs(t); o--;) t = (n * (o + 1) ^ t + o) % n, i[o] = t
  }
  return i
}


/*
  Utils
*/
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function encodeHTMLEntities(text) {
  var textArea = document.createElement('textarea');
  textArea.innerText = text;
  return textArea.innerHTML;
}

Object.defineProperty(Array.prototype, 'chunk', {value: function(n) {
  return Array.from(Array(Math.ceil(this.length/n)), (_,i)=>this.slice(i*n,i*n+n));
}});


/*
  Playlist Scraping
*/
new_tracks = 0
printed_rows = []
track_list_no_urls = []

do {
  new_tracks = 0
  audio_rows = document.querySelectorAll('.CatalogBlock__my_audios ._audio_pl .audio_row')

  for (const audio_row of audio_rows) {
    fullId = audio_row.dataset.fullId
    audio = JSON.parse(audio_row.dataset.audio)

    if (!printed_rows.includes(fullId)) {
      printed_rows.push(fullId)

      performers = audio_row.querySelector('.audio_row__performers').textContent
      title = audio_row.querySelector('.audio_row__title_inner').textContent
      subtitle = audio_row.querySelector('.audio_row__title_inner_subtitle').textContent
      title_subtitle = title + ((subtitle.length > 0) ? ' (' + subtitle + ')' : '')

      audioHashes = audio[13].split('/')
      actionHash = audioHashes[2]
      urlHash = audioHashes[5]

      console.log(performers + ' — ' + title_subtitle)

      track_list_no_urls.push([fullId, actionHash, urlHash, title_subtitle, performers])

      new_tracks ++
    }
  }

  if (!skip_scrolling) audio_rows[audio_rows.length - 1].scrollIntoView()

  await delay(1000)
} while (new_tracks > 0)


/*
  Getting urls and making XSPF
*/
xspf = `<?xml version="1.0" encoding="UTF-8"?>
<playlist version="1" xmlns="http://xspf.org/ns/0/">
  <trackList>
`

track_list_chunks = track_list_no_urls.chunk(10)
chunk_counter = 0
for (const track_list_chunk of track_list_chunks) {
  ids = track_list_chunk
    .filter(track => { return track[0].length > 0 && track[1].length > 0 && track[2].length > 0 })
    .map(track => { return track[0] + "_" + track[1] + "_" + track[2] })
    .join(',')

  no_url_indexes = track_list_chunk
    .map((track, index) => { return (track[0].length <= 0 || track[1].length <= 0 || track[2].length <= 0) ? index : -1 })
    .filter(index => { return index >= 0 })

  response = await fetch("https://vk.com/al_audio.php?act=reload_audio", {
    "headers": {
      "accept": "*/*",
      "accept-language": "ru,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Yandex\";v=\"21\", \" Not;A Brand\";v=\"99\", \"Chromium\";v=\"93\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest"
    },
    "referrer": "https://vk.com/audios" + id,
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": "al=1&ids=" + ids,
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  })
  reload_audio_json = await response.json()
  reload_audio_tracks = reload_audio_json.payload[1][0]

  while (no_url_indexes.length > 0) {
    shifted = no_url_indexes.shift()
    reload_audio_tracks.splice(shifted, 0, ['', '', 'https://m.vk.com/mp3/audio_api_unavailable.mp3', '', '', 25])
  }

  for (const [index, reload_audio_track] of reload_audio_tracks.entries()) {
    while (reload_audio_tracks[index][2].length <= 0) {
      console.log('repeat request for empty url')
      response = await fetch("https://vk.com/al_audio.php?act=reload_audio", {
        "headers": {
          "accept": "*/*",
          "accept-language": "ru,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua": "\"Yandex\";v=\"21\", \" Not;A Brand\";v=\"99\", \"Chromium\";v=\"93\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Linux\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://vk.com/audios" + id,
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "al=1&ids=" + track_list_chunk[index][0] + "_" + track_list_chunk[index][1] + "_" + track_list_chunk[index][2],
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      })
      reload_audio_json = await response.json()

      reload_audio_tracks[index] = reload_audio_json.payload[1][0][0]

      await delay(3000)
    }
  }
  console.log('chunk: ' + chunk_counter++)

  xspf += track_list_chunk
    .map((track, index) => {
      encoded_audio_url = reload_audio_tracks[index][2]
      duration = reload_audio_tracks[index][5]

      audio_url = ''
      try {
        audio_url = s(encoded_audio_url)
      } catch(e) {
        audio_url = encoded_audio_url
      }
      console.log(audio_url)

      return `    <track>
      <location>` + audio_url + `</location>
      <title>` + encodeHTMLEntities(track[3]) + `</title>
      <creator>` + encodeHTMLEntities(track[4]) + `</creator>
      <duration>` + duration + `000</duration>
    </track>
` })
    .join('')

  if (only_first_ten) break

  await delay(3000)
}

xspf += `  </trackList>
</playlist>
`

console.save_xspf(xspf, 'prepend_playlist.xspf')
