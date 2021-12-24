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
  if (!o() && ~e.indexOf("audio_api_unavailable")) {
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

new_tracks = 0
printed_rows = []
track_names = ''
track_names_count = 0

xspf = `<?xml version="1.0" encoding="UTF-8"?>
<playlist version="1" xmlns="http://xspf.org/ns/0/">
  <trackList>
`

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function encodeHTMLEntities(text) {
  var textArea = document.createElement('textarea');
  textArea.innerText = text;
  return textArea.innerHTML;
}

do {
  new_tracks = 0
  audio_rows = document.querySelectorAll('.audio_page__audio_rows_list .audio_row')

  for (const audio_row of audio_rows) {
    fullId = audio_row.dataset.fullId
    audio = JSON.parse(audio_row.dataset.audio)

    if (!printed_rows.includes(fullId)) {
      printed_rows.push(fullId)

      performers = audio_row.querySelector('.audio_row__performers').textContent
      title = audio_row.querySelector('.audio_row__title_inner').textContent
      subtitle = audio_row.querySelector('.audio_row__title_inner_subtitle').textContent

      audioHashes = audio[13].split('/')
      actionHash = audioHashes[2]
      urlHash = audioHashes[5]

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
        "referrer": "https://vk.com/audios13370370",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "al=1&ids=" + fullId + "_" + actionHash + "_" + urlHash,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      })

      reload_audio_json = await response.json()
      encoded_audio_url = reload_audio_json.payload[1][0][0][2]
      duration = reload_audio_json.payload[1][0][0][5]
      console.log(encoded_audio_url)
      audio_url = s(encoded_audio_url)

      track_name = performers + ' — ' + title
      track_name += (subtitle.length > 0) ? ' (' + subtitle + ')' : ''

      track_title = title + ((subtitle.length > 0) ? ' (' + subtitle + ')' : '')

      track_names += track_name + '\n'
      track_names_count ++
      console.log(track_name)

      xspf += `    <track>
      <location>` + audio_url + `</location>
      <title>` + encodeHTMLEntities(track_title) + `</title>
      <creator>` + encodeHTMLEntities(performers) + `</creator>
      <duration>` + duration + `000</duration>
    </track>
`

      await delay(1500)

      new_tracks ++
    }
  }

  audio_rows[audio_rows.length - 1].scrollIntoView()

  await delay(1000)
} while (new_tracks > 0)


xspf += `  </trackList>
</playlist>
`

console.log(track_names)
console.log(track_names_count)
