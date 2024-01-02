import * as config from "./config.js";
const log = console.log;
let now_playing_status, previous_now_playing_status;
const timestamp = (new Date).toLocaleTimeString(),
	artwork = document.querySelector(".artwork"),
	root = document.querySelector(":root"),
	music_player = document.querySelector(".music_player"),
	album_cover_dom = document.querySelector(".album_cover"),
	info = document.querySelector(".music_player_info"),
	titles_container = document.querySelector(".music_player_title_container"),
	titles = document.querySelector(".music_player_title"),
	artists_container = document.querySelector(".music_player_artist_container"),
	artists = document.querySelector(".music_player_artist"),
	albums_container = document.querySelector(".music_player_album_container"),
	albums = document.querySelector(".music_player_album"),
	bar_container_dom = document.querySelector(".bar_container"),
	pulse_container_dom = document.querySelector(".pulse_container"),
	pulse_dom = document.querySelectorAll(".pulse");
artwork.style.display = config.hide_cover ? "none" : "initial", album_cover_dom.style.animation = config.album_cover_spin ? "spin 10s linear infinite" : "", bar_container_dom.style.display = config.album_cover_bar ? "flex" : "", pulse_container_dom.style.display = config.album_cover_pulse ? "initial" : "", config.album_cover_circle && Array.from(pulse_dom).forEach((e => e.style.borderRadius = "50%")), album_cover_dom.style.borderRadius = config.album_cover_circle ? "50%" : null, music_player.style.background = config.widget_style_map[config.music_player_background_style].background, music_player.style.color = config.widget_style_map[config.music_player_background_style].color, root.style.setProperty("--pulse-color", config.widget_style_map[config.music_player_background_style].pulse_color);
let previous_song_id = "",
	access_token = localStorage.getItem("jho_spotify_widget_access_token") || "";
async function fetch_access_token() {
	const e = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`
		},
		body: `grant_type=refresh_token&refresh_token=${config.refresh_token}`
	});
	if (!e.ok) throw new Error("Unable to fetch access token.");
	const {
		access_token: o
	} = await e.json();
	return localStorage.setItem("jho_spotify_widget_access_token", o), log(`New access token fetched: [...${o.slice(-6)}]`), o
}
async function update_now_playing() {
	try {
		const o = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
			headers: {
				Authorization: `Bearer ${access_token}`
			}
		});
		if (401 === o.status || 400 === o.status) return log(`Access token [...${access_token.slice(-6)}] is no longer valid. Fetching new access token...`), access_token = await fetch_access_token(), update_now_playing();
		if (!o.ok) throw new Error(`Request failed with status: ${o.status}`);
		if (200 === o.status) {
			const t = await o.json();
			if (t.is_playing) {
				music_player.classList.add("show"), t.is_playing !== previous_now_playing_status && (log("Resuming..."), previous_now_playing_status = t.is_playing), now_playing_status = t.is_playing;
				const s = t.item.id,
					a = t.item.artists.map((e => e.name)).join(", "),
					n = (t.item.album.artists.map((e => e.name)).join(", "), function(e) {
						const o = e.progress_ms,
							t = e.item.duration_ms,
							s = Math.floor(o / 6e4),
							a = Math.floor(o % 6e4 / 1e3),
							n = Math.floor(t / 6e4),
							i = Math.floor(t % 6e4 / 1e3),
							r = `${s.toString().padStart(2,"0")}:${a.toString().padStart(2,"0")}`,
							c = `${n.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`,
							l = (o / t * 100).toFixed(2);
						return {
							progress: r,
							duration: c,
							progress_percentage: l + "%"
						}
					}(t)),
					i = t.item.album.images,
					r = "https://placehold.co/300x300/EEE/31343C?font=open-sans&text=J",
					c = 1,
					l = c >= 1 && c <= i.length ? i[c - 1].url : r,
					_ = t.item.name,
					u = a,
					p = t.item.album.name,
					m = (n.progress_percentage, n.progress, n.duration);

				function e(e, o) {
					let t = o.className,
						s = document.querySelector("." + t).parentNode;
					s.innerHTML = `<p class='${t}'>${e}</p>`, s.classList.contains("animate") && s.classList.remove("animate");
					let a = document.querySelector("." + t);
					if (a.scrollWidth > info.clientWidth) {
						let o = a.parentNode;
						a.parentNode.innerHTML = `<p class='${t}'>${e}</p><p class='${t}'>${e}</p>`, o.classList.add("animate")
					}
				}
				s !== previous_song_id && (console.group(`[${timestamp}] %cNow playing:`, "color: #fff; background-color: #333; padding: 5px;"), log(`%cSong Title: %c${_}`, "color: lime; font-weight: bold;", "color: aqua; font-weight: bold;"), log(`%cArtist: %c${u}`, "color: lime; font-weight: bold;", "color: aqua; font-weight: bold;"), log(`%cAlbum: %c${p}`, "color: lime; font-weight: bold;", "color: aqua; font-weight: bold;"), log(`%cDuration: %c${m}`, "color: lime; font-weight: bold;", "color: aqua; font-weight: bold;"), log(`%cID: %c${s}`, "color: lime; font-weight: bold;", "color: aqua; font-weight: bold;"), console.groupEnd(), e(_, titles), e(u, artists), e(p, albums), album_cover_dom.src = l, previous_song_id = s)
			} else now_playing_status = !1, now_playing_status !== previous_now_playing_status && (log("No song is currently playing."), music_player.classList.remove("show"), previous_now_playing_status = now_playing_status)
		} else 204 === o.status && (now_playing_status = !1, now_playing_status !== previous_now_playing_status && (log("No song is currently playing."), music_player.classList.remove("show"), previous_now_playing_status = now_playing_status))
	} catch (g) {
		console.error(g)
	}
}
setInterval(update_now_playing, 1e3 * config.refresh_rate);
